import express, { query } from 'express';
import dbo from '../db/conn.js';
import inspector from 'schema-inspector';
import { v4 as uuidv4 } from 'uuid';
import hash from '../encryption.js';
import { ObjectId } from 'mongodb';

const router = express.Router();


// NOTE: Every entity will now contain a status field that has default value of available. Users can use their own status system within the data object,
// or they can use the api provided status field. They can override the default value to whatever naming system they want to use, but the default system
// is available or unavailable.


function isInt(n){
    return Number(n) === n && n % 1 === 0;
}

function isFloat(n){
    return Number(n) === n && n % 1 !== 0;
}


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

router.post('/', checkAuth, async (req, res) => {
    // Create a new entity with the given data

    
    if (req.body.collection === undefined) {
        return res.status(400).json({
            error: "Improper entity format. Entity must specify a collection to which it belongs."
        });
    } else if (req.body.collectionId === undefined) {
        return res.status(400).json({
            error: "Improper entity format. Entity must specify a collection ID to which it belongs."
        });
    } else if (req.body.organization === undefined) {
        return res.status(400).json({
            error: "Improper entity format. Entity must specify the name organization to which it belongs."
        });
    } else if (req.body.organizationId === undefined) {
        return res.status(400).json({
            error: "Improper entity format. Entity must specify the organization ID to which it belongs."
        });
    } else if (req.body.createdBy === undefined) {
        return res.status(400).json({
            error: "Improper entity format. Entity must specify the organization ID that it was created by."
        });
    } else if (req.body.data === undefined) {
        return res.status(400).json({
            error: "Improper entity format. Entity must have a field labeled data which contains the physical entity data"
        });
    }

    // Get the collection to which the entity will belong and check if it has a schema
    const collections = dbo.getCollectionsCollection();

    const collection = await collections.findOne({collectionId: req.body.collectionId});

    if (collection == null) {
        return res.status(404).json({
            error: "No collection found with matching collection ID"
        });
    }

    // Find the collection named with the collection specified in the request body. If it does not exist, return an error along with the URL for creating a new
    // collection for the user's convenience.

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
        collection: req.body.collection,
        collectionId: req.body.collectionId,
        organization: req.body.organization,
        organizationId: req.body.organizationId,
        createdBy: req.body.createdBy,
        dateTimeLastUpdated: Date.now(),
        data: req.body.data
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


router.patch('/:entityId/:dateTimeLastUpdated', checkAuth, async (req, res) => {
    if (req.params.dateTimeLastUpdated === undefined) {
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
    const entity = await entities.findOne({entityId: req.params.entityId, organizationId: req.passedData.organizationId});


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

router.get('/', checkAuth, async (req, res) => {
    // Take in query parameters and query the database accordingly. Use the organization's public ID to restrict them to view only their own 
    // entities as well.

    // Initialize the limit value to 15
    let limit = 15;

    // Initialize the db query object
    let dbQueryObj = {
        organizationId: req.passedData.organizationId,
    };



    let queryIndex = req.url.indexOf('?');

    // Get query string
    let queryString = req.url.substring(queryIndex+1);

    console.log(`Query Index: ${queryIndex}`);

    if (queryIndex == -1) {
        console.log('setting default query string limit value');
        // Set the query string equal to the default limit query parameter if there is no query string provided
        queryString = `limit=${limit}`;
    }

    console.log(`Query string: ${queryString}`);
    
    // Divide by the & signs in the string
    let paramArray = queryString.split('&');


    // For each string in the split array, add to the query object to send to the database
    for (let paramString of paramArray) {
        // Each portion of the new array of strings split by the & sign should have an equal sign. Split based on those symbols
        let tempArray = paramString.split('=');

        console.log(`Temp array: ${tempArray[0]}, ${tempArray[1]}`);

        // Check if the value should be transformed into an int or a float
        if (tempArray[1].indexOf('.') === -1) {
            // Attempt to cast to an int
            let attemptedParse = parseInt(tempArray[1]);
            if (attemptedParse !== NaN && attemptedParse !== null) {
                tempArray[1] = attemptedParse;
            }
        } else {
            // Attempt to cast to a float
            let attemptedParse = parseFloat(tempArray[1]);
            if (attemptedParse !== NaN && attemptedParse !== null) {
                tempArray[1] = attemptedParse;
            }
        }

        // Check if the value should be transformed into a boolean
        if (tempArray[1] == "true") {
            tempArray[1] = true;
        } else if (tempArray[1] == "false") {
            tempArray[1] = false;
        }


        // Check if the key is a mandatory key that is not user-determined (not part of the data key which is determined by the user). If it is one
        // of those keys, simply add it to the query object if it is not in the query object already. Otherwise, add the parameter inside of the data
        // key to the query object in order to properly query for the desired user-defined field(s).

        // <-------------------------- This section is what I see as a messier, less efficient way of handling the query string ---------------------->
        /*if (tempArray[0] === 'entityId' || tempArray[0] === 'collection' || tempArray[0] === 'collectionId' || tempArray[0] === 'organization' || 
        tempArray[0] === 'organizationId' || tempArray[0] === 'createdBy' || tempArray[0] === 'dateTimeLastUpdated' || tempArray[0] === 'limit') {
            if (tempArray[0] !== 'organizaitonId' && tempArray[0] !== 'limit' && tempArray[0] !== 'next') {
                dbQueryObj[tempArray[0]] = tempArray[1];
            } else if (tempArray[0] === 'limit') {
                limit = parseInt(tempArray[1]);
            } else if (tempArray[0] === 'next') {
                // We get the next set of returns for the query presented
                query._id = {$lt: parseInt(tempArray[1])};
            }
        } else {
            // We must be dealing with the data portion of the object in the query, so place the query param inside a JSON object called data.
            dbQueryObj.data[tempArray[0]] = tempArray[1];
        }*/
        // <------------------------------------------------------------------------------------------------------------------------------------------>

        if (tempArray[0] === 'organizationId') {
            // Skip the iteration and do nothing
            continue;
        } else if (tempArray[0] === 'entityId' || tempArray[0] === 'collection' || tempArray[0] === 'collectionId' || tempArray[0] === 'organization' ||
         tempArray[0] === 'createdBy' || tempArray[0] === 'dateTimeLastUpdated') {
            // We must be dealing with a key that does not reside within the data object. Add directly to the query object
            dbQueryObj[tempArray[0]] = tempArray[1];
        } else if (tempArray[0] === 'limit') {
            // Set the limit to the non-default value to determine how many documents will be returned
            limit = parseInt(tempArray[1]);
            // Restrict the limit on the number of documents that can be returned at one time. I have set the limit to 50 here
            if (limit > 50) {
                limit = 50;
            }
        } else if (tempArray[0] === 'next') {
            // Get the next set of returns for the query
            // Convert the string to an objectId type object
            const oid = new ObjectId(tempArray[1]);
            dbQueryObj._id = {$gt: oid};
        } else {
            // We must be dealing with the parameters that will be found within the data object of the entity
            //dbQueryObj.data[`${tempArray[0]}`] = `${tempArray[1]}`;
            dbQueryObj[`data.${tempArray[0]}`] = tempArray[1];
        }
        
    }

    // Determine if the data portion of the query object is empty. If it is empty, delete it from the query object
    /*if (Object.keys(dbQueryObj.data).length === 0) {
        delete dbQueryObj.data;
    }*/

    console.log(`DB Query Object: ${JSON.stringify(dbQueryObj)}`);

    // Query the database
    const entities = dbo.getEntitiesCollection();
    

//<--------This section converts query result directly to an array. I think there is a better way to handle it that also allows for pagination.---------->
    // NOTE: This can be dangerous if the number of documents returned is too high and exceeds memory available on the machine it is running on. 
    // It is better practice to use a forEach, however, I think the best solution for this particular case is to limit people from getting too
    // many documents at one time.
    /*
    const result = entities.find(dbQueryObj).sort({_id: -1}).limit(limit);
    const items = await result.toArray();

    // Check if the array is empty or only has one result
    if (items.length == 0) {
        return res.status(200).json({
            entities: "",
        });
    } else if (items.length == 1) {
        return res.status(200).json({
            entities: items[0]
        });
    }

    console.log(items);

    const next = items[items.length - 1]._id;
    //const lastItem = items[items.length - 1];
    //console.log(`Last Item: ${lastItem}`);
    //const next = lastItem["_id"];

    return res.status(200).json({
        entities: items,
        next: next
    });*/
//<------------------------------------------------------------------------------------------------------------------------>

    const cursor = entities.find(dbQueryObj).sort({_id: 1});

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
            entities: itemArray
        });
    } else {
        return res.status(200).json({
            entities: itemArray,
            next: next
        });
    }
    
});


export default router;