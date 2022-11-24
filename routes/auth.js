//import express from 'express';

// Will implement this route in the future for use with access tokens when users/organizations want to share their data. Will also need to implement so
// user/organizations can log into their account to see usage statistics and other useful things in the future. For now, we will operate only with
// an API key. Note that you only get one API key per account, and at the moment there is no way to request a new key. 

// TODO: Implement a route to request a new API key, which requires email and password, as well as the old API key? 
// TODO: Implement a route to invalidate an account's API key. The account email and password must be provided in order to do this.
// TODO: Create a website that interfaces with this portion of the API to allow users to control their account information in a visual
// manner. This would make for a better, more understandable user experience. We could even tokenize these routes and require that a 
// token be provided instead of email and password. In other words, present email and password to a login route and receive a token in
// exchange, then use the token to do what you want in the auth route. The token will not be accepted if you try to use it on other endpoints.


/*

NOTE: For the permissions value, if a collection allows access to all keys and all values, just use empty brackets meaning that everything is allowed to be
changed to whatever the user would like

TOKEN SCHEMA = {
    issuedBy: orgName,
    issuedById: orgId,
    issuedForId: orgId token was generated for,
    issuedFor: org name token was generated for,
    exp: DateTime of expiry,
    permissions: {
        collections: [{collection1: [{key1: [possible values]}, {key2: [possible values]}]}, {collection2: [{key1: [possible values]}]}],
    }
}

*/ 


const router = express.Router();

// TODO: Users can either directly use their API key or they can create and use access tokens to access the API. The auth route is only applicable if the user opts 
// to use access tokens. To get an access token, the user must 


/*router.post('/', (req, res) => {
    // Log user in
    // Require the user to provide the organization ID of the organization they wish to get a token for in the headers of the request
    
});*/

// export default router;