import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.DATABASE_URI);

//let dbConnection;

/*const dbo = {
    connectToServer: function(callback) {
        client.connect(function(err, db) {
            if (err || !db) {
                return callback(err);
            }
            dbConnection = db.db('rentity');
            console.log('Successfully connected to database');
            return callback();
        })
    },
    getDb: function() {
        return dbConnection;
    }
};*/

const dbo = {
    connectToDatabase: async function() {
        try {
            await client.connect();
            console.log('Connected to database');
        } catch(err) {
            console.log(err);
        }
    },
    closeDb: async function() {
        await client.close();
    },
    getOrganizationsCollection: function() {
        return client.db('rentity_api').collection('organizations');
    },
    getEntitiesCollection: function() {
        return client.db('rentity_api').collection('entities');
    },
    getCollectionsCollection: function() {
        return client.db('rentity_api').collection('collections');
    }
};

export default dbo;