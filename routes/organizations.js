import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { generateApiKey } from 'generate-api-key';
import dbo from '../db/conn.js';
import hash from '../encryption.js';

const router = express.Router();

//const algorithm = 'aes-256-ctr';
//const secretKey = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3';

const validateEmail = (email) => {
    return email.match(
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
  };


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
         //req.passedData = organization;
         req.passedData = {
             organization: organization.organization,
             organizationId: organization.organizationId,
             createdBy: organization.organizationId
         };
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


// Creates a user and generates an API key for that user. The user can then use that API key to create collections and entities. They will have to create a 
// proxy API which stores and manages the API key that also handles user creation and user permissions/actions for the user/organization's specific needs for their
// use case.

// For security, organizations will provide their API key encoded (encrypted somehow) in the auth header. We will match the API key and act accordingly for 
// creation of collections and entities, and interacting with those entities in any way. The public ID will also have to be encrypted with a different encryption
// key and placed in the headers as well (maybe this is overkill?). 

router.post('/', async (req, res) => {
    // Create a new organization
    if (!req.body.fname || !req.body.lname || !req.body.email || !req.body.organization) {
        return res.status(400).json({
            error: "Improper user creation format"
        });
    }

    // convert the organization name to spaces replaced with underscores and all lowercase
    let org = req.body.organization.toLowerCase();
    org = org.replace(/\s+/g, '-'); 

    // Make sure that the organization name is unique
    const organizations = dbo.getOrganizationsCollection();
    let duplicates;
    try{
        duplicates = await organizations.countDocuments({organization: org});
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

    // Generate and store encrypted password based on input password in the headers
    const encrypted = hash.encrypt(req.body.password);

    // Generate an API key/refresh token for the user
    const apiKey = generateApiKey({method: 'base32'});

    // Encrypt the API key
    // Use the same iv value that the password was hashed with
    const encryptedAPIKey = hash.encrypt(apiKey);

    // NOTE: The key expiration date is a year from the day of creation of the account. This will not be needed in this iteration, but
    // it may be nice to have in the future to enforce renewal of API keys for better security.

    // Move forward with creating the new user
    const user = {
        organizationId: publicId,
        organization: org,
        fname: req.body.fname,
        lname: req.body.lname,
        password: encrypted.encryptedContent,
        email: req.body.email,
        key: encryptedAPIKey,
        keyExpiration: Date.now() + (1000*60*60*24*365),
        collections: 0,
        entities: 0,
        verified: true,
        loggedIn: true
    };

    const orgCollection = dbo.getOrganizationsCollection();

    const result = await orgCollection.insertOne(user);

    // Check if the storage was a success
    if (result.acknowledged != true) {
        return res.status(400).json({
            error: "Could not store user account in the database. Please try again later."
        });
    }


    // Send response to user
    return res.status(201).setHeader('x-api-key', apiKey).json({
        account: {
            organizationId: publicId,
            organization: org,
            fname: req.body.fname,
            lname: req.body.lname,
            email: req.body.email,
            collection: 0,
            entities: 0,
        }
    });
    
});

router.get('/', checkAuth, (req, res) => {
    // Returns the public data on an organization
});


// <------------ Begin "experimental routes". We will see if these make for a better use experience than the non-hierarchical routes ------------->

// Create a new collection within an organization
router.post('/:orgName/collections', checkAuth, async (req, res) => {
    let organizationId = req.passedData.organizationId;
    let organization = req.passedData.organization;
    if (organizationId === undefined || organization === undefined) {
        return res.status(401).json({
            error: 'Improper authorization. Access denied'
        });
    }

    // Check that the orgName matches the organization corresponding to key or token provided.
    if (req.params.orgName !== organization) {
        return res.status(401).json({
            error: "Provided API key does not have permission to access this organization."
        });
    }

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
        creator: req.passedData.createdBy,
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


// Create a new entity within a collection within an organization
router.post('/:orgName/collections/:collectionName/entities',checkAuth, async (req, res) => {
    // All that is required in the body is the portion of the object that will be placed inside the data field. Thus, there is no need to 
    // label it as data. We can just put whatever we want in the body.

    if (req.params.orgName !== req.passedData.organization) {
        return res.status(401).json({
            error: "Provided API key does not have permission to access this organization."
        });
    } 

    // Query the collection with the organization name, ID, and the collection name
    const collections = dbo.getCollectionsCollection();
    const collection = await collections.findOne({
        name: req.params.collectionName, organizationId: req.passedData.organizationId,
        organization: req.passedData.organization
    });

    if (collection == null) {
        return res.status(401).json({
            error: "No matching collection found within the organization. Access denied."
        });
    }


    // The collection exists. Check if it has a schema
    if (collection.schema !== undefined) {
        // Check the schema against the data field provided in the request body
        if (!inspector.validate(collection.schema, req.body.data)) {
            return res.status(400).json({
                error: "Entity does not match schema of the collection. All entities within a collection with a specified schema must match that schema"
            });
        }
    } 



    const entityId = uuidv4();


    const entityObj = {
        entityId: entityId,
        collection: collection.name,
        collectionId: collection.collectionId,
        organization: req.passedData.organization,
        organizationId: req.passedData.organizationId,
        createdBy: req.passedData.createdBy,
        dateTimeLastUpdated: Date.now(),
        data: req.body
    };

    // Create the entity
    const dbCollection = dbo.getEntitiesCollection();
    const result = await dbCollection.insertOne(entityObj);

    if (result.acknowledged) {
        // Return the result of the insert to the user
        return res.status(201).json({
            entity: entityObj
        });
    } else {
        return res.status(400).json({
            error: "Could not store user account in the database. Please try again later."
        });
    }
});

router.patch('/:orgName/collections/:collectionName/entities/:entityId/:dateTimeLastUpdated', checkAuth, async (req, res) => {
    if (req.params.orgName !== req.passedData.organization) {
        return res.status(401).json({
            error: "Provided API key does not have permission to access this organization."
        });
    } else if (req.params.dateTimeLastUpdated === undefined) {
        return res.status(400).json({
            error: "Unable to update the entity. Both entity ID and dateTime last updated must be provided (in milliseconds)."
        });
    } else if (req.params.entityId === undefined) {
        return res.status(400).json({
            error: "Unable to update entity. Both entity ID and datetime last updated must be provided (in milliseconds)."
        });
    }

    // Match the API key with the provided entity ID. Find the entity specified here within the organization corresponding to the provided key
    const entities = dbo.getEntitiesCollection();
    const entity = await entities.findOne({
        entityId: req.params.entityId,
        collection: req.params.collectionName,
        organizationId: req.passedData.organizationId
    });

    if (entity == null) {
        return res.status(401).json({
            error: "No matching entity found within the organization. Access denied."
        });
    }


    // Check that dateTime last updated matches
    if (parseInt(req.params.dateTimeLastUpdated) !== entity.dateTimeLastUpdated) {
        return res.status(400).json({
            error: "DateTime last updated does not match entity."
        });
    }

    // Get the collection that the entity belongs to and check if it has a schema.
    const collections = dbo.getCollectionsCollection();
    const collection = await collections.findOne({collectionId: entity.collectionId});

    if (collection == null) {
        return res.status(404).json({
            error: "Collection does not exist."
        });
    } 

    // DateTime last updated must match, so update the dateTimeLastUpdated field in the entity to the current dateTime
    entity.dateTimeLastUpdated = Date.now();

    // Change the entity based on the entity ID provided.
    // Only allow changes to occur within the data field of the entity
    for (var key in req.body) {
        if (req.body.hasOwnProperty(key)) {
            // Add the property or change it
            entity.data[key] = req.body[key];
        }
    }

    if (collection.schema !== undefined) {
        // Check the newly modified entity against the schema in the collection
        if (!inspector.validate(collection.schema, entity.data)) {
            return res.status(400).json({
                error: "The entity you are trying to modify belongs to a collection with a pre-defined schema. The entity's data must match that of the collection."
            });
        }
    }

    const query = {
        organizationId: entity.organizationId,
        entityId: entity.entityId,
        dateTimeLastUpdated: parseInt(req.params.dateTimeLastUpdated)
    };

    /*const options = {
        returnDocument: "after"
    };

    const result = await entities.findOneAndReplace(query, entity, options);*/
    const result = await entities.replaceOne(query, entity);

    if (!result.acknowledged && result.modifiedCount == 1) {
        return res.status({
            error: "Could not update the entity due to server error. Please try again later."
        });
    }

    return res.status(200).json({
        result: result,
        entity: entity
    });
});


// <---------------------------------------------------------------------------------------------------------------------------------------------->

export default router;