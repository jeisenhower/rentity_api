# rentity_api
This is an experimental API written with Node.js and Express with a MongoDB database that attempts to accomplish the goal of allowing users or
organizations to create entities owned or controlled by the organization that they wish to rent out or allow other users to reserve. 
It is essentially a generic data storage API with some extra meausres for organizational purposes put in place. Those measures include a hierarchy for
the different entities that the organization wishes to rent out. The hierarchy is comprised initially of an organization. That organization can create many
collections within it; each collection having its own unique name within the organization. Each collection can contain many entities. 
There is no specific schema for entities and collections, other than the fact that they must have a unique name and ID, respectively, 
within the organization (see Open API documentation for details). 

I apologize for the code not being very readable (there is commented out code everywhere), as I have been experimenting with this project and lately
and have not cleaned it up. The only route in the routes folder that is currently being used is the organizations.js route. I recently decided to make
a hierarchical route structure in order to make things appear more logically to the end user. Despite the messiness, the API works and is currently
deployed on a linode server if you would like to play around with it. I did write, to the best of my ability, Open API documentation on the API,
so please refer to that if you wish to use it at all. 

I have actually implemented a working application using this API, however there are many improvements that need to take place. For one, the code
needs to be reorganized. The hierarchical routes can be placed in separate files so we don't have all of the routes in one big file all 
together. Also, some of the if/else statements could probably be re-written in a more efficient way. Overall, this API is intended to eventually be 
used as a tool to implement bigger projects that have more specific use cases. The goal of this project was to create something that is generic yet 
allows us to enforce things in a way that is not controlled directly by the creator of the API, but by the organization using it.
