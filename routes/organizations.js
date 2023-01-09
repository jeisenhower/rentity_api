import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { generateApiKey } from 'generate-api-key';
import dbo from '../db/conn.js';
import hash from '../encryption.js';
import collectionsRouter from './collections.js';
import checkAuth from '../auth.js';

const orgRouter = express.Router();


const validateEmail = (email) => {
    return email.match(
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};


// Creates a user and generates an API key for that user. The user can then use that API key to create collections and entities. They will have to create a 
// proxy API which stores and manages the API key that also handles user creation and user permissions/actions for the user/organization's specific needs for their
// use case.

// For security, organizations will provide their API key encoded (encrypted somehow) in the auth header. We will match the API key and act accordingly for 
// creation of collections and entities, and interacting with those entities in any way. The public ID will also have to be encrypted with a different encryption
// key and placed in the headers as well (maybe this is overkill?). 

// NOTE: Came up with a better idea than actively keeping track of number of entities and number of collections. Whenever we get user profile information, just run
// a query to find total number of entities and total number of collections belonging to the organization, then return that with the rest of the profile info.
// On queries involving collections, return the number of entities by doing a query on the number of entities belonging to the collection and adding it to the 
// return data.

orgRouter.post('/', async (req, res) => {
    // Create a new organization
    if (!req.body.fname || !req.body.lname || !req.body.email || !req.body.organization) {
        return res.status(400).json({
            error: "Improper user creation format"
        });
    }

    // convert the organization name to spaces replaced with underscores and all lowercase
    let org = req.body.organization.toLowerCase();
    org = org.replace(/\s+/g, '-'); 
    
    try {
        // Make sure that the organization name is unique
        const organizations = dbo.getOrganizationsCollection();
        let duplicates;
        try {
            duplicates = await organizations.countDocuments({ organization: org });
        } catch (err) {
            return res.status(400).json({
                error: err
            });
        }

        console.log(`Duplicate organization name count: ${duplicates}`);

        if (duplicates > 0) {
            return res.status(403).json({
                error: "The organization name you provided already exists. Please choose another."
            });
        }

        // Check the user's email format is correct
        if (!validateEmail(req.body.email)) {
            return res.status(400).json({
                error: "Improper email format. Please provide a valid email address"
            });
        }

        // Generate a unique ID for the user
        const publicId = uuidv4();

        // Generate an API key/refresh token for the user
        const newKey = generateApiKey({ method: 'base32' });

        // Encrypt the API key
        // Use the same iv value that the password was hashed with
        const encryptedAPIKey = hash.encrypt(newKey);

        // NOTE: The key expiration date is a year from the day of creation of the account. This will not be needed in this iteration, but
        // it may be nice to have in the future to enforce renewal of API keys for better security.

        // Move forward with creating the new user
        const user = {
            organizationId: publicId,
            organization: org,
            fname: req.body.fname,
            lname: req.body.lname,
            email: req.body.email,
            apiKey: encryptedAPIKey,
            keyExpiration: Date.now() + (1000 * 60 * 60 * 24 * 365),
            verified: true,
            loggedIn: true
        };

        const orgCollection = dbo.getOrganizationsCollection();

        const result = await orgCollection.insertOne(user);

        // Check if the storage was a success
        if (result.acknowledged != true) {
            return res.status(500).json({
                error: "Could not store user account in the database. Please try again later."
            });
        }


        // Send response to user
        return res.status(201).setHeader('x-api-key', newKey).json({
            organizationId: publicId,
            organization: org,
            fname: req.body.fname,
            lname: req.body.lname,
            email: req.body.email,
            collections: 0,
            entities: 0,
        });
    } catch (err) {
        return res.status(500).json({
            error: err
        });
    }
});

orgRouter.get('/:orgName', checkAuth, async (req, res) => {
    // Returns the public data on an organization
    if (req.params.orgName !== req.passedData.organization) {
        return res.status(401).json({
            error: "Provided API key does not have permission to access this organization."
        });
    }

    try {
        const orgs = dbo.getOrganizationsCollection();
    const org = await orgs.findOne({organization: req.passedData.organization, organizationId: req.passedData.organizationId});
    if (org == null) {
        return res.status(404).json({
            error: "No organization found."
        });
    }

    const collections = dbo.getCollectionsCollection();
    const collectionsCount = await collections.countDocuments({organization: req.passedData.organization, organizationId: req.passedData.organizationId});

    const entities = dbo.getEntitiesCollection();
    const entitiesCount = await entities.countDocuments({organization: req.passedData.organization, organizationId: req.passedData.organizationId});
    
    const obj = {
        organization: org.organization,
        organizationId: org.organizationId,
        fname: org.fname,
        lname: org.lname,
        email: org.email,
        collections: collectionsCount,
        entities: entitiesCount
    }

    return res.status(200).json({
        profile: obj
    })
    } catch (err) {
        return res.status(500).json({
            error: "Internal server error. Could not get organization data."
        });
    }
});

// Delete an organization account
orgRouter.delete('/:orgName', checkAuth, async (req, res) => {
    if (req.params.orgName !== req.passedData.organization) {
        return res.status(401).json({
            error: "Provided API key does not have permission to access this organization."
        });
    }

    try {
        // Find the organization and delete it. Also delete all collections and entities belonging to the organization
        const collections = dbo.getCollectionsCollection();
        const entities = dbo.getEntitiesCollection();
        const orgs = dbo.getOrganizationsCollection();

        // Check if organization exists
        const org = await orgs.findOne({ organization: req.passedData.organization, organizationId: req.passedData.organizationId });

        if (org == null) {
            return res.status(404).json({
                error: "Organization does not exist."
            });
        }


        // Delete all entities belonging to the organization
        const entityResult = await entities.deleteMany({ organization: req.passedData.organization, organizationId: req.passedData.organizationId });
        if (!entityResult.acknowledged) {
            return res.status(500).json({
                error: "Could not delete entities."
            });
        }
        const collectionsResult = await collections.deleteMany({ organization: req.passedData.organization, organizationId: req.passedData.organizationId });
        if (!collectionsResult.acknowledged) {
            return res.status(500).json({
                error: "Could not delete collections."
            });
        }
        const orgResult = await orgs.deleteOne({ organization: req.passedData.organization, organizationId: req.passedData.organizationId });
        if (!orgResult.acknowledged) {
            return res.status(500).json({
                error: "Could not delete collections."
            });
        }

        return res.status(200).json({
            message: "Your organization has been successfully deleted."
        });
    } catch (err) {
        return res.status(500).json({
            error: err
        });
    }
});


// <------------ Begin "experimental routes". We will see if these make for a better use experience than the non-hierarchical routes ------------->

// Connect to the collections Router from the collections.js route file. This will allow us to organize the hierarchical format of the api in cleaner
// presentation

//orgRouter.use(':orgName/collections', collectionsRouter);






// <---------------------------------------------------------------------------------------------------------------------------------------------->

export default orgRouter;