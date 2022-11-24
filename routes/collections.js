import express from 'express';
import dbo from '../db/conn.js';
import { v4 as uuidv4 } from 'uuid';


// Route that returns information on the collections created by an organization as well as allows creators of an organization to create new collections and 
// assign permissions to each collection.

// A collection must have a name, id, a schema, and a set of permissions for whatever keys need to be restricted and what values they can be set to

const router = express.Router();


async function checkAuth(req, res, next) {
   // Get the api key and look up the corresponding account with it. Whatever user, if any, it corresponds to, pass the user's account info along by creating
    // a new organization object within the req object
    // If user is using api key, pass along the user profile in the passed data object added to the req object. If using access tokens, get the data from the
    // access token and pass it in the passed data object, as well as set a req.method variable as appropriate (either key or token).
    if (req.headers['key'] !== undefined && (req.headers['organizationid'] !== undefined || req.headers['organization'] !== undefined)) {
        // Look up the organization and see if the key matches the organization
        const organizations = dbo.getOrganizationsCollection();
        let organization = null;
        if (req.headers['organizationid'] !== undefined) {
            organization = await organizations.findOne({publicId: req.headers['organizationid']});
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

        if (req.headers['key'] !== decryptedAPIKey) {
            return res.status(401).json({
                error: "Access denied. Invalid API key."
            });
        }

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
    if (!req.authorized) {
        return res.status(401).json({
            error: "permission denied"
        });
    }

    if (!req.body.name || !req.body.schema) {
        return res.status(400).json({
            error: "Improper collection creation format"
        });
    }

    const collectionsCollection = dbo.getCollectionsCollection();

    const collectionId = uuidv4();

    const organizationId = '';
    const organization = '';
    if (req.method == 'key') {
        organizationId = req.passedData.publicId;
        organization = req.passedData.organization;
    } else if (req.method == 'token') {
        organizationId = req.passedData.issuedById;
        organization = req.passedData.issuedBy;
    } else {
        return res.status(401).json({
            error: 'Improper authorization. Access denied'
        });
    }

    // isPublic is used for access by other users. I may not use this and just use tokens specified to access certain collections and what permissions they
    // have to access those collections.

    let isPublic = false;
    if (req.body.isPublic !== undefined && typeof req.body.isPublic == "boolean") {
        isPublic = req.body.isPublic;
    }

    const collectionObj = {
        name: req.body.name,
        isPublic: isPublic,
        collectionId: collectionId,
        creator: req.passedData.publicId,
        organizationId: organizationId,
        organization: organization,
    };

    // One last thing to do is decide if we should include a schema key
    if (req.body.schema !== undefined) {
        collectionObj.schema = req.body.schema;
    }

    const result = await collectionsCollection.insertOne(collectionObj);

    return res.status(201).json({
        result: result
    });
});


// Query parameters will specify pagination as follows: For pagination, they will specify a limit on number of documents returned. Upon response from the
// server, the user will receive the results, along with a next value. The next value can then be used in the query string to get the next set of values
// from the server.
router.get('/', checkAuth, async (req, res) => {
    // Returns the specified collections belonging to the organization. 

    if (req.query.limit === undefined) {
        return res.status(400).json({
            error: "Improper query string format. Must contain a limit"
        });
    }

    

    let query = {organizationId: req.passedData.publicId};

    // If there is a next parameter passed, change the query accordingly
    if (req.query.next !== undefined) {
        // We get the next set of returns for the query presented
        query._id = {$lt: req.query.next}; 
    }


    // Run the query on the database and send result to user, along with the "next" value
    
    const collections = dbo.getCollectionsCollection();
    items = await collections.find(query).sort({_id: -1}).limit(req.query(limit));

    const next = items[items.length - 1]._id;

    return res.status(200).json({
        items: items,
        next: next
    });

    // When the user wants to get the next set of the query, they simply add that to their previous query parameter set

});


export default router;