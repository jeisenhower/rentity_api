import dbo from './db/conn.js';
import hash from './encryption.js';

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
            organization = await organizations.findOne({ organizationId: req.headers['organizationid'] });
        } else if (req.headers['organization'] !== undefined) {
            organization = await organizations.findOne({ organization: req.headers['organization'] });
        } else {
            return res.status(401).json({
                error: 'Organization name or ID must be provided in addition to the API key in request headers.'
            });
        }
        if (organization == null) {
            return res.status(401).json({
                error: 'Organization does not exist. Access denied.'
            });
        }

        // Check that the provided API key matches the user profile api key
        let encryptedAPIKey = organization.apiKey;
        let decryptedAPIKey = hash.decrypt(encryptedAPIKey);

        if (req.headers['x-api-key'] !== decryptedAPIKey) {
            return res.status(401).json({
                error: 'Access denied. Invalid API key.'
            });
        }

        req.passedData = {
            organization: organization.organization,
            organizationId: organization.organizationId,
            createdBy: organization.organizationId
        };
        next();
    } else if (req.headers['token']) {
        return res.status(401).json({
            error: 'The Rentity API does not yet support the use of tokens; only API keys at the moment. Please check back later.'
        });
    } else {
        return res.status(401).json({
            error: 'Auth format not recognized.'
        });
    }

}

export default checkAuth;
