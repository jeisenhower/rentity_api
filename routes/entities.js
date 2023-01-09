import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import dbo from '../db/conn.js';
import { ObjectId } from 'mongodb';

const entitiesRouter = express.Router({mergeParams: true});

// Create a new entity within a collection within an organization
entitiesRouter.post('/', checkAuth, async (req, res) => {
    // All that is required in the body is the portion of the object that will be placed inside the data field. Thus, there is no need to 
    // label it as data. We can just put whatever we want in the body.

    if (req.params.orgName !== req.passedData.organization) {
        return res.status(401).json({
            error: "Provided API key does not have permission to access this organization."
        });
    }

    try {
        // Query the collection with the organization name, ID, and the collection name
        const collections = dbo.getCollectionsCollection();
        const collectionQuery = {
            name: req.params.collectionName, organizationId: req.passedData.organizationId,
            organization: req.passedData.organization
        };
        const collection = await collections.findOne(collectionQuery);

        if (collection == null) {
            return res.status(401).json({
                error: "No matching collection found within the organization. Access denied."
            });
        }


        // The collection exists. Check if it has a schema
        if (collection.collectionSchema !== undefined) {
            // Check the schema against the data field provided in the request body
            if (!inspector.validate(collection.collectionSchema, req.body.data)) {
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

        if (!result.acknowledged) {
            return res.status(500).json({
                error: "Could not persist new entity to the database. Please try again later."
            });

        }

        // Return the result of the insert to the user
        return res.status(201).json(entityObj);
    } catch (err) {
        return res.status(500).json({
            error: err
        });
    }

});

// Gets information on a specific entity (will only return one entity, never an array)
entitiesRouter.get('/:entityId', checkAuth, async (req, res) => {
    if (req.params.orgName !== req.passedData.organization) {
        return res.status(401).json({
            error: "Provided API key does not have permission to access this organization."
        });
    }

    try {
        const entities = dbo.getEntitiesCollection();
        const entity = await entities.findOne({
            entityId: req.params.entityId,
            collection: req.params.collectionName,
            organizationId: req.passedData.organizationId
        });

        if (entity == null) {
            return res.status(404).json({
                error: "No matching entity found within the organization."
            });
        } else {
            return res.status(200).json({
                entity: entity
            });
        }
    } catch (err) {
        return res.status(500).json({
            error: err
        });
    }


});

entitiesRouter.patch('/:entityId/:dateTimeLastUpdated', checkAuth, async (req, res) => {
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

    try {
        // Match the API key with the provided entity ID. Find the entity specified here within the organization corresponding to the provided key
        const entities = dbo.getEntitiesCollection();
        const entity = await entities.findOne({
            entityId: req.params.entityId,
            collection: req.params.collectionName,
            organizationId: req.passedData.organizationId
        });

        if (entity == null) {
            return res.status(404).json({
                error: "No matching entity found within the organization. Access denied."
            });
        }


        // Check that dateTime last updated matches
        if (parseInt(req.params.dateTimeLastUpdated) !== entity.dateTimeLastUpdated) {
            return res.status(403).json({
                error: "DateTime last updated does not match entity."
            });
        }

        // Get the collection that the entity belongs to and check if it has a schema.
        const collections = dbo.getCollectionsCollection();
        const collection = await collections.findOne({ collectionId: entity.collectionId });

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

        const result = await entities.replaceOne(query, entity);

        if (!result.acknowledged || result.modifiedCount !== 1) {
            return res.status(500).json({
                error: "Could not update the entity due to server error. Please try again later."
            });
        }

        return res.status(200).json(entity);
    } catch (err) {
        return res.status(500).json({
            error: err
        });
    }
});


// Query the entities within a collection within an organization (advanced query)
entitiesRouter.post('/queries', checkAuth, async (req, res) => {
    if (req.params.orgName !== req.passedData.organization) {
        return res.status(401).json({
            error: "Provided API key does not have permission to access this organization."
        });
    }

    try {
        let limit = 15;

        let dbQueryObj = req.body;

        // Add the organization data corresponding to the provided api key to the query object
        dbQueryObj.organizationId = req.passedData.organizationId;
        dbQueryObj.organization = req.passedData.organization;
        dbQueryObj.collection = req.params.collectionName;

        if (req.query.limit !== undefined) {
            limit = req.query.limit;
        }

        if (req.query.next !== undefined) {
            const oid = new ObjectId(req.query.next);
            dbQueryObj._id = { $gt: oid };
        }

        console.log(req.query.limit);
        console.log(req.query.next);

        const entities = dbo.getEntitiesCollection();

        const cursor = entities.find(dbQueryObj).sort({ _id: 1 });

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
    } catch (err) {
        return res.status(500).json({
            error: err
        });
    }
});


entitiesRouter.delete('/:entityId', checkAuth, async (req, res) => {
    // Delete the entity and update the entity count within the collection, as well as update the global entity count within the organization profile
    if (req.params.orgName !== req.passedData.organization) {
        return res.status(401).json({
            error: "Provided API key does not have permission to access this organization."
        });
    } else if (req.params.entityId === undefined) {
        return res.status(400).json({
            error: "No entity ID provided."
        });
    } else if (req.params.collectionName === undefined) {
        return res.status(400).json({
            error: "No collection name provided."
        });
    }
    

    try { 
        // Delete the entity
        const entities = dbo.getEntitiesCollection();
        const result = await entities.deleteOne({
            entityId: req.params.entityId,
            collection: req.params.collectionName,
            organization: req.passedData.organization,
            organizationId: req.passedData.organizationId
        });

        if (!result.acknowledged) {
            return res.status(500).json({
                error: "Could not delete the specified entity."
            });
        }

        if (result.deletedCount < 1) {
            return res.status(404).json({
                error: "Entity not found."
            });
        }

        return res.status(200).json({
            message: "Entity successfully deleted."
        });
    } catch (err) {
        return res.status(500).json({
            error: err
        });
    }
});

export default entitiesRouter;
