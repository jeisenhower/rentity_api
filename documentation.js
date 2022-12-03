const swagger = {
  "openapi": "3.0.0",
  "info": {
    "version": "1.0.0",
    "title": "Rentity",
    "description": "Create entities and rent them out to your users in any way you like. Start by creating an organization account. With that account, users can add collections and entities. Collections can define a description which can define common data among all of the collection's entities. Entities are objects or things whose state can be represented in the Rentity API database. Users define how to describe an entity."
  },
  "paths": {
    "/organizations": {
      "post": {
        "summary": "Create a new organization. Organizations can hold collections which may define schemas and have user-defined descriptions. Collections can hold entities",
        "responses": {
          "201": {
            "description": "New organization has been created",
            "headers": {
              "x-api-key": {
                "schema": {
                  "$ref": "#/components/schemas/X-API-KEY"
                }
              }
            },
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Organization"
                }
              }
            }
          },
          "400": {
            "description": "Duplicate organization. Organization needs unique organization name",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "500": {
            "description": "Internal server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/organizations/{organizationName}": {
      "parameters": [
        {
          "name": "organizationName",
          "description": "The unique name of the organization which the user is trying to access",
          "in": "path",
          "required": true,
          "schema": {
            "$ref": "#/components/schemas/OrganizationName"
          }
        }
      ],
      "get": {
        "summary": "Get organization profile information",
        "security": [
          {
            "ApiKey": [],
            "OrganizationId": []
          },
          {
            "ApiKey": [],
            "OrganizationNameKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "The organization corresponding to the provided unique `organizationName`",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Organization"
                }
              }
            }
          },
          "401": {
            "description": "Provided API key does not authorize access to requested profile data",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "No organization found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "500": {
            "description": "Internal server error. Could not get organization data",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "Delete the organization and all collections and entities associated with it",
        "security": [
          {
            "ApiKey": [],
            "OrganizationId": []
          },
          {
            "ApiKey": [],
            "OrganizationNameKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "The organization and all associated collection and entities were deleted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/SuccessMessage"
                }
              }
            }
          },
          "400": {
            "description": "Could not delete all entities, collections, and organization data due to server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized. Provided API key not authorized to access the organization data",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Could not find organization to delete",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "500": {
            "description": "Internal server error. Could not delete organization and its collections",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/organizations/{organizationName}/collections": {
      "parameters": [
        {
          "name": "organizationName",
          "description": "The unique name of the organization which the user is trying to access",
          "in": "path",
          "required": true,
          "schema": {
            "$ref": "#/components/schemas/OrganizationName"
          }
        }
      ],
      "post": {
        "summary": "Create a new collection belonging to an organization. A collection can contain a description field which typically defines common data among all of a collection's entities",
        "security": [
          {
            "ApiKey": [],
            "OrganizationId": []
          },
          {
            "ApiKey": [],
            "OrganizationNameKey": []
          }
        ],
        "responses": {
          "201": {
            "description": "New collection successfully created",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Collection"
                }
              }
            }
          },
          "400": {
            "description": "Duplicate collection name. All collections within an organization must be unique",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized. Provided API key does not permit access to the organization specified in the URL",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "500": {
            "description": "Could not create collection due to internal server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/organizations/{organizationName}/collections/queries": {
      "parameters": [
        {
          "name": "organizationName",
          "description": "The unique name of the organization which the user is trying to access",
          "in": "path",
          "required": true,
          "schema": {
            "$ref": "#/components/schemas/OrganizationName"
          }
        }
      ],
      "post": {
        "summary": "Run an advanced query with the request body contents on the collections endpoint within an organization. Collections matching the query are returned",
        "security": [
          {
            "ApiKey": [],
            "OrganizationId": []
          },
          {
            "ApiKey": [],
            "OrganizationNameKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "Successful query",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CollectionArray"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized. Provided API key does not permit access to the organization specified in the URL",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "500": {
            "description": "Internal server error. Could not run the query",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/organizations/{organizationName}/collections/{collectionName}": {
      "parameters": [
        {
          "name": "organizationName",
          "description": "The unique name of the organization which the user is trying to access",
          "in": "path",
          "required": true,
          "schema": {
            "$ref": "#/components/schemas/OrganizationName"
          }
        },
        {
          "name": "collectionName",
          "description": "Name of the collection belonging to the organization",
          "in": "path",
          "required": true,
          "schema": {
            "$ref": "#/components/schemas/CollectionName"
          }
        }
      ],
      "get": {
        "summary": "Read a collection",
        "security": [
          {
            "ApiKey": [],
            "OrganizationId": []
          },
          {
            "ApiKey": [],
            "OrganizationNameKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "The specified collection was successfully read",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Collection"
                }
              }
            }
          },
          "400": {
            "description": "Improper URL format",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized. Provided API key does not permit access to the organization specified in the URL",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "No collection found matching the URL collection name within the organization",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "500": {
            "description": "Internal server error. Could not get collection data",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "Delete a collection and all entities associated with that collection",
        "security": [
          {
            "ApiKey": [],
            "OrganizationId": []
          },
          {
            "ApiKey": [],
            "OrganizationNameKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "The collection and all its entities were successfully deleted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/SuccessMessage"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized. Provided API key does not permit access to the organization specified in the URL",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "500": {
            "description": "Collection could not be fully deleted due to server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/organizations/{organizationName}/collections/{collectionName}/{dateTimeLastUpdated}": {
      "parameters": [
        {
          "name": "organizationName",
          "description": "The unique name of the organization which the user is trying to access",
          "in": "path",
          "required": true,
          "schema": {
            "$ref": "#/components/schemas/OrganizationName"
          }
        },
        {
          "name": "collectionName",
          "description": "Name of the collection belonging to the organization",
          "in": "path",
          "required": true,
          "schema": {
            "$ref": "#/components/schemas/CollectionName"
          }
        }, 
        {
          "name": "dateTimeLastUpdated",
          "description": "The datetime in milliseconds that the collection was last updated",
          "in": "path",
          "required": true,
          "schema": {
            "$ref": "#/components/schemas/DateTimeLastUpdated"
          }
        }
      ],
      "patch": {
        "summary": "Update the description field of a collection. No other fields in the collection are allowed to be modified at will by users",
        "security": [
          {
            "ApiKey": [],
            "OrganizationId": []
          },
          {
            "ApiKey": [],
            "OrganizationNameKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "The specified collection was successfully updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Collection"
                }
              }
            }
          },
          "400": {
            "description": "Improper URL format",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized. Provided API key does not permit access to the organization specified in the URL",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "Datetime last updated of the collection does not match that of the URL",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "500": {
            "description": "Internal server error. Could not update the collection",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/organizations/{organizationName}/collections/{collectionName}/entities": {
      "parameters": [
        {
          "name": "organizationName",
          "description": "The unique name of the organization which the user is trying to access",
          "in": "path",
          "required": true,
          "schema": {
            "$ref": "#/components/schemas/OrganizationName"
          }
        },
        {
          "name": "collectionName",
          "description": "Name of the collection belonging to the organization",
          "in": "path",
          "required": true,
          "schema": {
            "$ref": "#/components/schemas/CollectionName"
          }
        }
      ],
      "post": {
        "summary": "Create a new entity within a collection belonging to an organization. If the collection to which the entity is added contains a schema, the entity must match that schema",
        "security": [
          {
            "ApiKey": [],
            "OrganizationId": []
          },
          {
            "ApiKey": [],
            "OrganizationNameKey": []
          }
        ],
        "responses": {
          "201": {
            "description": "The entity was successfully created",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Entity"
                }
              }
            }
          },
          "400": {
            "description": "The entity does not match the specified collection schema format",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized. Provided API key does not permit access to the organization specified in the URL",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "500": {
            "description": "Could not successfully create entity due to server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/organizations/{organizationName}/collections/{collectionName}/entities/queries": {
      "parameters": [
        {
          "name": "organizationName",
          "description": "The unique name of the organization which the user is trying to access",
          "in": "path",
          "required": true,
          "schema": {
            "$ref": "#/components/schemas/OrganizationName"
          }
        },
        {
          "name": "collectionName",
          "description": "Name of the collection belonging to the organization",
          "in": "path",
          "required": true,
          "schema": {
            "$ref": "#/components/schemas/CollectionName"
          }
        }
      ],
      "post": {
        "summary": "Run an advanced query using the request body as query paramters to get matching entities from a collection",
        "security": [
          {
            "ApiKey": [],
            "OrganizationId": []
          },
          {
            "ApiKey": [],
            "OrganizationNameKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "The query ran successfully and any matching entities are returned",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/EntityArray"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized. Provided API key does not permit access to the organization specified in the URL",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "500": {
            "description": "Internal server error. Could not perform the query",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    }, 
    "/organizations/{organizationName}/collections/{collectionName}/entities/{entityId}": {
      "parameters": [
        {
          "name": "organizationName",
          "description": "The unique name of the organization which the user is trying to access",
          "in": "path",
          "required": true,
          "schema": {
            "$ref": "#/components/schemas/OrganizationName"
          }
        },
        {
          "name": "collectionName",
          "description": "Name of the collection belonging to the organization",
          "in": "path",
          "required": true,
          "schema": {
            "$ref": "#/components/schemas/CollectionName"
          }
        },
        {
          "name": "entityId",
          "description": "The unique identifier of the entity the user is trying to access within the collection",
          "in": "path",
          "required": true,
          "schema": {
            "$ref": "#/components/schemas/EntityId"
          }
        }
      ],
      "get": {
        "summary": "Read an entity",
        "security": [
          {
            "ApiKey": [],
            "OrganizationId": []
          },
          {
            "ApiKey": [],
            "OrganizationNameKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "Successfully found and returned the specified entity",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Entity"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized. Provided API key does not permit access to the organization specified in the URL",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "No entity found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "500": {
            "description": "Internal server error. Could not get entity data",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "Delete an entity from a collection",
        "security": [
          {
            "ApiKey": [],
            "OrganizationId": []
          },
          {
            "ApiKey": [],
            "OrganizationNameKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "Successfully deleted the specified entity",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/SuccessMessage"
                }
              }
            }
          },
          "400": {
            "description": "Improper URL format",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized. Provided API key does not permit access to the organization specified in the URL",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Could not find entity to be deleted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "500": {
            "description": "Could not fully delete entity due to internal server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/organizations/{organizationName}/collections/{collectionName}/entities/{entityId}/{dateTimeLastUpdated}": {
      "parameters": [
        {
          "name": "organizationName",
          "description": "The unique name of the organization which the user is trying to access",
          "in": "path",
          "required": true,
          "schema": {
            "$ref": "#/components/schemas/OrganizationName"
          }
        },
        {
          "name": "collectionName",
          "description": "Name of the collection belonging to the organization",
          "in": "path",
          "required": true,
          "schema": {
            "$ref": "#/components/schemas/CollectionName"
          }
        },
        {
          "name": "entityId",
          "description": "The unique identifier of the entity the user is trying to access within the collection",
          "in": "path",
          "required": true,
          "schema": {
            "$ref": "#/components/schemas/EntityId"
          }
        },
        {
          "name": "dateTimeLastUpdated",
          "description": "The datetime in milliseconds that the collection was last updated",
          "in": "path",
          "required": true,
          "schema": {
            "$ref": "#/components/schemas/DateTimeLastUpdated"
          }
        }
      ],
      "patch": {
        "summary": "Update an entity. Only the data field of the entity can be updated by the user",
        "security": [
          {
            "ApiKey": [],
            "OrganizationId": []
          },
          {
            "ApiKey": [],
            "OrganizationNameKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "The entity was successfully updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Entity"
                }
              }
            }
          },
          "400": {
            "description": "Improper URL format or changes do not match the collection schema",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized. Provided API key does not permit access to the organization specified in the URL",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "Datetime last updated of the entity does not match that of the URL.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "No entity found within the organization collection matching the specified entity ID",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "500": {
            "description": "Internal server error. Could not update the entity",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "OrganizationName": {
        "type": "string",
        "description": "The unique organization name identifier"
      },
      "Organization": {
        "description": "The root profile necessary for creation of collections and entities. An organization profile could belong to a singular user, or to an entire organization",
        "type": "object",
        "required": [
          "organizationId",
          "organization",
          "fname",
          "lname",
          "email",
          "collections",
          "entities"
        ],
        "properties": {
          "organizationId": {
            "description": "UUID belonging to the organization",
            "type": "string"
          },
          "organization": {
            "description": "Unique name of the organization",
            "type": "string"
          },
          "fname": {
            "description": "First name of the organization creator",
            "type": "string"
          },
          "lname": {
            "description": "Last name of the organization creator",
            "type": "string"
          },
          "email": {
            "description": "Email of the organization creator",
            "type": "string"
          },
          "collections": {
            "description": "Number of collections currently existing in the organization",
            "type": "integer"
          },
          "entities": {
            "description": "Total number of entities currently existing in the organization.",
            "type": "integer"
          }
        }
      },
      "CollectionName": {
        "type": "string",
        "description": "The name of the collection, unique to the organization"
      },
      "Collection": {
        "description": "A grouping of entities within an organization. Organizations create collections in order to organize their entities. Collections can hold common data among entities as well as schemas which all its entities must match",
        "type": "object",
        "required": [
          "name",
          "collectionId",
          "creator",
          "organization",
          "organizationId",
          "dateTimeLastUpdated",
          "numEntities"
        ],
        "properties": {
          "name": {
            "description": "The unique name of the new collection",
            "type": "string"
          },
          "collectionId": {
            "description": "The UUID of the new collection, assigned automatically by the Rentity API",
            "type": "string"
          },
          "creator": {
            "description": "The organization ID of the organization who created the collection",
            "type": "string"
          },
          "organization": {
            "description": "The name of the organization to which the collection belongs",
            "type": "string"
          },
          "organizationId": {
            "description": "The organization UUID of the organization to which the collection belongs",
            "type": "string"
          },
          "dateTimeLastUpdated": {
            "description": "The datetime in milliseconds which the collection was last updated",
            "type": "integer"
          },
          "numEntities": {
            "description": "The current number of entities within the collection",
            "type": "string"
          },
          "description": {
            "description": "An optional, potentially nested object that may include any common data among all entities within the collection. Users can use this field however they see fit",
            "type": "object"
          },
          "collectionSchema": {
            "description": "An optional nested object that outlines the schema of all entities created within the collection",
            "type": "object"
          }
        }
      },
      "CollectionArray": {
        "description": "An array of Collection objects",
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/Collection"
        }
      },
      "EntityId": {
        "description": "The UUID of an entity",
        "type": "string"
      },
      "Entity": {
        "description": "A physical object or thing whose state can be represented and tracked as a database object in the Rentity API.",
        "type": "object",
        "required": [
          "entityId",
          "collection",
          "collectionId",
          "organization",
          "organizationId",
          "createdBy",
          "dateTimeLastUpdated",
          "data"
        ],
        "properties": {
          "entityId": {
            "description": "The UUID of the entity",
            "type": "string"
          },
          "collection": {
            "description": "The name of the collection to which the entity belongs, unique to the organization",
            "type": "string"
          },
          "collectionId": {
            "description": "The UUID of the collection to which the entity belongs",
            "type": "string"
          },
          "organization": {
            "description": "The name of the organization to which the entity belongs",
            "type": "string"
          },
          "organizationId": {
            "description": "The UUID of the organization to which the entity belongs",
            "type": "string"
          },
          "createdBy": {
            "description": "The name of the organization responsible for creating the entity",
            "type": "string"
          },
          "dateTimeLastUpdated": {
            "description": "The datetime that the entity was last updated or changed",
            "type": "string"
          },
          "data": {
            "description": "The user-defined portion of the entity. The user can store any data they would like, so long as it matches the collection schema, if it has one",
            "type": "object"
          }
        }
      },
      "EntityArray": {
        "description": "An array of entity objects",
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/Entity"
        }
      },
      "X-API-KEY": {
        "type": "string",
        "description": "The api key for the organization to access its content"
      },
      "SuccessMessage": {
        "type": "object",
        "required": [
          "message"
        ],
        "properties": {
          "message": {
            "description": "A human readable success message",
            "type": "string"
          }
        }
      },
      "Error": {
        "type": "object",
        "required": [
          "error"
        ],
        "properties": {
          "error": {
            "description": "A human readable error message",
            "type": "string"
          }
        }
      }
    },
    "securitySchemes": {
      "ApiKey": {
        "type": "apiKey",
        "in": "header",
        "name": "X-Api-Key"
      },
      "OrganizationId": {
        "type": "apiKey",
        "in": "header",
        "name": "X-Organization-Id"
      },
      "OrganizationNameKey": {
        "type": "apiKey",
        "in": "header",
        "name": "X-Organization"
      }
    }
  },
  "security": [
    {
      "ApiKey": [],
      "OrganizationId": []
    },
    {
      "ApiKey": [],
      "OrganizationNameKey": []
    }
  ]
};

  export default swagger;