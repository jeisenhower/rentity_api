import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import dbo from '../db/conn.js';
import { ObjectId } from 'mongodb';
import entitiesRouter from './entities.js';
import checkAuth from '../auth.js';

const collectionsRouter = express.Router({mergeParams: true});

// Create a new collection within an organization
collectionsRouter.post('/', checkAuth, async (req, res) => {
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
            error: "Improper collection creation format."
        });
    }

    try {
        const collectionsCollection = dbo.getCollectionsCollection();

        // Convert name to all lower case and replace spaces with underscores
        let name = req.body.name.toLowerCase();
        name = name.replace(/\s+/g, '-');
        console.log(`name: ${name}`);


        const collectionId = uuidv4();


        // Make sure the collection name is unique for the user
        const duplicates = await collectionsCollection.countDocuments({ organizationId: organizationId, name: name });
        if (duplicates > 0) {
            return res.status(400).json({
                error: "Each collection within an organization must have a unique name."
            });
        }
        console.log(`organizationId: ${organizationId}`);
        console.log(`Duplicates: ${duplicates}`);

        // isPublic is used for access by other users. I may not use this and just use tokens specified to access certain collections and what permissions they
        // have to access those collections.

        let collectionObj = {
            name: name,
            collectionId: collectionId,
            creator: req.passedData.createdBy,
            organizationId: organizationId,
            organization: organization,
            dateTimeLastUpdated: Date.now(),
        };

        // One last thing to do is decide if we should include a schema key
        if (req.body.collectionSchema !== undefined) {
            collectionObj.collectionSchema = req.body.collectionSchema;
        }

        // Allow the user to create an optional description field that can hold whatever data the user wants (most likely for common data among entities 
        // within the collection). The goal is to help prevent entities from having redundant data in them if possible.
        if (req.body.description !== undefined) {
            collectionObj.description = req.body.description;
        }

        const result = await collectionsCollection.insertOne(collectionObj);

        if (!result.acknowledged) {
            return res.status(500).json({
                error: "Could not store user account in the database. Please try again later."
            });
        }

        // Add the entity count to the return object
        collectionObj.numEntities = 0;


        return res.status(201).json(collectionObj);
    } catch (err) {
        return res.status(500).json({
            error: err
        });
    }
});

// Update the collection (other than the schema)
// TODO: Need to figure out how to handle when a user wants to delete a field from the description in the collection
collectionsRouter.patch('/:collectionName/:dateTimeLastUpdated', checkAuth, async (req, res) => {
    if (req.params.orgName !== req.passedData.organization) {
        return res.status(401).json({
            error: "Provided API key does not have permission to access this organization."
        });
    } else if (req.params.dateTimeLastUpdated === undefined) {
        return res.status(400).json({
            error: "Unable to update the collection. Both collection anme and dateTime last updated must be provided (in milliseconds)."
        });
    } else if (req.params.collectionName === undefined) {
        return res.status(400).json({
            error: "Unable to update collection. Both collection name and datetime last updated must be provided (in milliseconds)."
        });
    }

    try {
        // Match the API key with the provided collection name. Find the collection specified here within the organization corresponding to the provided key
        const queryObj = {
            name: req.params.collectionName,
            organizationId: req.passedData.organizationId,
            organization: req.passedData.organization
        };
        const collections = dbo.getCollectionsCollection();
        const collection = await collections.findOne(queryObj);

        if (collection == null) {
            return res.status(401).json({
                error: "No matching collection found within the organization. Access denied."
            });
        }


        // Check that dateTime last updated matches
        if (parseInt(req.params.dateTimeLastUpdated) !== collection.dateTimeLastUpdated) {
            return res.status(403).json({
                error: "DateTime last updated does not match collection."
            });
        }

        // Update the datetime last updated field to the current time
        collection.dateTimeLastUpdated = Date.now();

        // Update the collection description data only
        for (let key in req.body) {
            if (req.body.hasOwnProperty(key)) {
                collection.description[key] = req.body[key];
            }
        }

        const result = await collections.replaceOne(queryObj, collection);

        if (!result.acknowledged || result.modifiedCount !== 1) {
            return res.status(500).json({
                error: "Could not update the collection due to server error. Please try again later."
            });
        }

        return res.status(200).json({
            result: result,
            collection: collection
        });
    } catch (err) {
        return res.status(500).json({
            error: err
        });
    }

});

// Perform advanced query on collections resource
collectionsRouter.post('/queries', checkAuth, async (req, res) => {
    if (req.params.orgName !== req.passedData.organization) {
        return res.status(401).json({
            error: "Provided API key does not have permission to access this organization."
        });
    }

    try {
        let limit = 15;

        let dbQueryObj = req.body;

        dbQueryObj.organization = req.passedData.organization;
        dbQueryObj.organizationId = req.passedData.organizationId;

        if (req.query.limit !== undefined) {
            limit = req.query.limit;
        }
        if (req.query.next !== undefined) {
            const oid = new ObjectId(req.query.next);
            dbQueryObj._id = { $gt: oid };
        }

        const collections = dbo.getCollectionsCollection();
        const cursor = collections.find(dbQueryObj);

        const entities = dbo.getEntitiesCollection();

        let i = 0;
        let itemArray = [];
        let next = 0;

        // Attempted to count number of entities in each collection on the fly in the code below. Not sure if it will work in practice or not
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

        // Find the number of entities belonging to each collection in the array of collections and add it to the collection data
        for (let item of itemArray) {
            // Query the number of entities belonging to the collection
            const entityCount = await entities.countDocuments({
                collection: item.name,
                collectionId: item.collectionId,
                organization: req.passedData.organization,
                organizationId: req.passedData.organizationId
            });
            item.numEntities = entityCount;
        }


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
    } catch (err) {
        return res.status(500).json({
            error: "Internal server error. Could not run query."
        });
    }
});

// Get a specific collection
collectionsRouter.get('/:collectionName', checkAuth, async (req, res) => {
    if (req.params.orgName !== req.passedData.organization) {
        return res.status(401).json({
            error: "Provided API key does not have permission to access this organization."
        });
    } else if (req.params.collectionName === undefined) {
        return res.status(400).json({
            error: "Missing collection name from URL."
        });
    }

    try {
        // Query the collection name within the organization
        const collections = dbo.getCollectionsCollection();
        const collection = await collections.findOne({
            organization: req.passedData.organization,
            organizationId: req.passedData.organizationId,
            name: req.params.collectionName
        });

        if (collection == null) {
            return res.status(404).json({
                error: "No collection matching this collection name found within the organization."
            });
        }

        // Query the number of entities belonging to this collection
        const entities = dbo.getEntitiesCollection();
        const numEntities = await entities.countDocuments({
            organization: req.passedData.organization,
            organizationId: req.passedData.organizationId,
            collection: req.params.collectionName,
            collectionId: collection.collectionId
        });

        collection.numEntities = numEntities;

        return res.status(200).json(collection);
    } catch (err) {
        return res.status(500).json({
            error: err
        });
    }
});

// Delete collection and all entities within the collection
collectionsRouter.delete('/:collectionName', checkAuth, async (req, res) => {
    if (req.params.orgName !== req.passedData.organization) {
        return res.status(401).json({
            error: "Provided API key does not have permission to access this organization."
        });
    }

    try {
        const collectionQueryObj = {
            organization: req.passedData.organization,
            organizationId: req.passedData.organizationId,
            name: req.params.collectionName
        };
    
        const entityQueryObj = {
            organization: req.passedData.organization,
            organizationId: req.passedData.organizationId,
            collection: req.params.collectionName
        };
    
        // Delete the entities belonging to the collection.
        const entities = dbo.getEntitiesCollection();
        const resultA = await entities.deleteMany(entityQueryObj);
        if (!resultA.acknowledged) {
            return res.status(500).json({
                error: "Could not delete entities belonging to the collection due to server error. Collection and entities remain undeleted."
            });
        }
    
        // If entity deletion successful, delete the collection itself
        const collections = dbo.getCollectionsCollection();
        const resultB = await collections.deleteOne(collectionQueryObj);
        if (resultB.deletedCount !== 1) {
            return res.status(500).json({
                error: "Entities were deleted but the collection could not be deleted due to server error. Please try again to delete the collection itself."
            });
        }
        
        return res.status(200).json({
            message: `${req.params.collectionName} collection and its entities successfully deleted.`
        });
    } catch (err) {
        return res.status(500).json({
            error: err
        });
    }

});

collectionsRouter.use('/:collectionName/entities', entitiesRouter);

export default collectionsRouter;