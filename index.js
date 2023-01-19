import express from 'express';
import bodyParser from 'body-parser';
import dbo from './db/conn.js';
import organizationsRouter from './routes/organizations.js';
import collectionsRouter from './routes/collections.js';
import entitiesRouter from './routes/entities.js';
import swagger from './documentation.js';

const server = async (port) => {

    const app = express();

    // Connect to database
    await dbo.connectToDatabase();

    //app.use(urlencoded({extended: true}));

    app.use(bodyParser.json());


    app.get('/api/v1', (req, res) => {
        return res.status(200).json(swagger);
    });

    app.use('/api/v1/organizations', organizationsRouter);
    app.use('/api/v1/organizations/:orgName/collections', collectionsRouter);
    app.use('/api/v1/organizations/:orgName/collections/:collectionName/entities', entitiesRouter);

    // eslint-disable-next-line no-undef
    app.listen(process.env.PORT || port, () => {
        // eslint-disable-next-line no-undef
        if (process.env.PORT) console.log(`Server listening on port ${process.env.PORT}`);
        else console.log(`Server listening on port ${port}`);
    });
};

await server(3000);