import express from 'express';
import bodyParser from 'body-parser';
import dbo from './db/conn.js';
import organizationsRouter from './routes/organizations.js';
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

    app.listen(process.env.PORT || port, () => {
        if (process.env.PORT) console.log(`Server listening on port ${process.env.PORT}`);
        else console.log(`Server listening on port ${port}`);
    });
}

await server(3000);