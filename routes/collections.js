import express from 'express';
import dbo from '../db/conn.js';
import { v4 as uuidv4 } from 'uuid';
import hash from '../encryption.js';
import { ObjectId } from 'mongodb';


// Route that returns information on the collections created by an organization as well as allows creators of an organization to create new collections and 
// assign permissions to each collection.

// A collection must have a name, id, a schema, and a set of permissions for whatever keys need to be restricted and what values they can be set to

const router = express.Router();


async function checkAuth(req, res, next) {
   // Get the api key and look up the corresponding account with it. Whatever user, if any, it corresponds to, pass the user's account info along by creating
    // a new organization object within the req object
    // If user is using api key, pass along the user profile in the passed data object added to the req object. If using access tokens, get the data from the
    // access token and pass it in the passed data object, as well as set a req.method variable as appropriate (either key or token).
    if (req.headers['x-api-key'] !== undefined && (req.headers['organizationid'] !== undefined || req.headers['organization'] !== undefined)) {
        // Look up the organization and see if the key matches the organization
        const organizations = dbo.getOrganizationsCollection();
        let organization = null;
        if (req.headers['organizationid'] !== undefined) {
            organization = await organizations.findOne({organizationId: req.headers['organizationid']});
        } else if (req.headers['organization'] !== undefined) {
            organization = await organizations.findOne({organization: req.headers['organization']});
        } else {
            return res.status(401).json({
                error: "Organization name or ID must be provided in addition to the API key in request headers."
            })
        }
        if (organization == null) {
            return res.status(401).json({
                error: "Organization does not exist. Access denied."
            });
        }

        // Check that the provided API key matches the user profile api key
        let encryptedAPIKey = organization.key;
        let decryptedAPIKey = hash.decrypt(encryptedAPIKey);

        if (req.headers['x-api-key'] !== decryptedAPIKey) {
            return res.status(401).json({
                error: "Access denied. Invalid API key."
            });
        }
        req.method = 'key';
        req.passedData = organization;
        next();
    } else if (req.headers['token']) {
        return res.status(401).json({
            error: "The Rentity API does not yet support the use of tokens; only API keys at the moment. Please check back later."
        });
    } else {
        return res.status(401).json({
            error: "Auth format not recognized."
        });
    }
    
}


// Create a new collection. Note that if no schema is provided, then there is no restriction or schema check necessary for creation of 
// entities within the collection.
router.post('/', checkAuth, async (req, res) => {
    // Create a new collection for the organization

    if (req.body.name === undefined) {
        return res.status(400).json({
            error: "Improper collection creation format"
        });
    }

    const collectionsCollection = dbo.getCollectionsCollection();

    // Convert name to all lower case and replace spaces with underscores
    let name = req.body.name.toLowerCase();
    name = name.replace(/\s+/g, '-');
    console.log(`name: ${name}`);


    const collectionId = uuidv4();

    let organizationId = '';
    let organization = '';
    if (req.method == 'key') {
        organizationId = req.passedData.organizationId;
        organization = req.passedData.organization;
    } else if (req.method == 'token') {
        organizationId = req.passedData.issuedById;
        organization = req.passedData.issuedBy;
    } else {
        return res.status(401).json({
            error: 'Improper authorization. Access denied'
        });
    }


    // Make sure the collection name is unique for the user
    const duplicates = await collectionsCollection.countDocuments({organizationId: organizationId, name: name});
    if (duplicates > 0) {
        return res.status(400).json({
            error: "Each collection within an organization must have a unique name."
        });
    }
    console.log(`organizationId: ${organizationId}`);
    console.log(`Duplicates: ${duplicates}`);

    // isPublic is used for access by other users. I may not use this and just use tokens specified to access certain collections and what permissions they
    // have to access those collections.

    let isPublic = false;
    if (req.body.isPublic !== undefined && typeof req.body.isPublic == "boolean") {
        isPublic = req.body.isPublic;
    }

    const collectionObj = {
        name: name,
        isPublic: isPublic,
        collectionId: collectionId,
        creator: req.passedData.organizationId,
        organizationId: organizationId,
        organization: organization,
    };

    // One last thing to do is decide if we should include a schema key
    if (req.body.schema !== undefined) {
        collectionObj.schema = req.body.schema;
    }

    const result = await collectionsCollection.insertOne(collectionObj);

    if (result.acknowledged) {
        return res.status(201).json({
            name: name,
            collectionId: collectionId,
            creator: req.passedData.organizationId,

        });
    } else {
        return res.status(400).json({
            error: "Could not store user account in the database. Please try again later."
        });
    }
    
});


// Query parameters will specify pagination as follows: For pagination, they will specify a limit on number of documents returned. Upon response from the
// server, the user will receive the results, along with a next value. The next value can then be used in the query string to get the next set of values
// from the server.
router.get('/', checkAuth, async (req, res) => {
    // Returns the specified collections belonging to the organization. 

    let limit = 15;

    if (req.query.limit !== undefined) {
        limit = req.query.limit;
    }

    

    let query = {organizationId: req.passedData.publicId};

    // If there is a next parameter passed, change the query accordingly
    if (req.query.next !== undefined) {
        // We get the next set of returns for the query presented
        const oid = new ObjectId(req.query.next);
        query._id = {$gt: oid}; 
    }


    // Run the query on the database and send result to user, along with the "next" value
    
    const collections = dbo.getCollectionsCollection();

    const cursor = collections.find(query).sort({_id: 1});

    let i = 0;
    let itemArray = [];
    let next = 0;
    await cursor.forEach(doc => {
        if (i < limit) {
            itemArray.push(doc);
        } 
        
        // Check if we have reached the end point for items that need to be returned. If we have, we set the 
        // "next" value equal to the last value's _id so we can return all objects above its _id value in the
        // next iteration or page.
        if (i === limit - 1) {
            next = doc._id;
        }
        i++;   
    });

    if (next == 0) {
        return res.status(200).json({
            collections: itemArray
        });
    } else {
        return res.status(200).json({
            collections: itemArray,
            next: next
        });
    }

    // When the user wants to get the next set of the query, they simply add that to their previous query parameter set

});


export default router;