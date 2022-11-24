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


// TODO: Implement this function
const verifyToken = (req, res, next) => {
    next();
};


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

    // Make sure that the organization name is unique
    const organizations = dbo.getOrganizationsCollection();
    const duplicates = organizations.countDocuments({organization: req.body.organization});

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
        publicId: publicId,
        organization: req.body.organization,
        fname: req.body.fname,
        lname: req.body.lname,
        password: encrypted.encryptedContent,
        iv: encrypted.iv,
        email: req.body.email,
        key: encryptedAPIKey,
        keyExpiration: Date.now() + (1000*60*60*24*365),
        collections: 0,
        entities: 0,
        verified: false,
        loggedIn: false
    };

    const orgCollection = dbo.getOrganizationsCollection();

    const result = await orgCollection.insertOne(user);

    return res.status(201).json({
        result: result
    });
    
});


router.get('/', verifyToken, (req, res) => {
    // Returns the public data on an organization
});


export default router;