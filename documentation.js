const swagger = {
    "swagger": "2.0",
    "info": {
      "version": "1.0.0",
      "title": "REST API",
      "description": ""
    },
    "host": "localhost:3000",
    "basePath": "/",
    "schemes": [
      "http"
    ],
    "paths": {
      "/": {
        "post": {
          "description": "",
          "parameters": [
            {
              "name": "body",
              "in": "body",
              "schema": {
                "type": "object",
                "properties": {
                  "collection": {
                    "example": "any"
                  },
                  "collectionId": {
                    "example": "any"
                  },
                  "data": {
                    "example": "any"
                  }
                }
              }
            }
          ],
          "responses": {
            "201": {
              "description": "Created"
            },
            "400": {
              "description": "Bad Request"
            },
            "401": {
              "description": "Unauthorized"
            }
          }
        },
        "get": {
          "description": "",
          "parameters": [],
          "responses": {
            "200": {
              "description": "OK"
            },
            "401": {
              "description": "Unauthorized"
            }
          }
        }
      },
      "/{orgName}/collections": {
        "post": {
          "description": "",
          "parameters": [
            {
              "name": "orgName",
              "in": "path",
              "required": true,
              "type": "string"
            },
            {
              "name": "body",
              "in": "body",
              "schema": {
                "type": "object",
                "properties": {
                  "name": {
                    "example": "any"
                  },
                  "isPublic": {
                    "example": "any"
                  },
                  "schema": {
                    "example": "any"
                  },
                  "description": {
                    "example": "any"
                  },
                  "fname": {
                    "example": "any"
                  },
                  "lname": {
                    "example": "any"
                  },
                  "email": {
                    "example": "any"
                  },
                  "organization": {
                    "example": "any"
                  },
                  "password": {
                    "example": "any"
                  }
                }
              }
            }
          ],
          "responses": {
            "201": {
              "description": "Created"
            },
            "400": {
              "description": "Bad Request"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "Forbidden"
            }
          }
        }
      },
      "/{orgName}/collections/{collectionName}/{dateTimeLastUpdated}": {
        "patch": {
          "description": "",
          "parameters": [
            {
              "name": "orgName",
              "in": "path",
              "required": true,
              "type": "string"
            },
            {
              "name": "collectionName",
              "in": "path",
              "required": true,
              "type": "string"
            },
            {
              "name": "dateTimeLastUpdated",
              "in": "path",
              "required": true,
              "type": "string"
            },
            {
              "name": "body",
              "in": "body",
              "schema": {
                "type": "object",
                "properties": {
                  "keykey": {
                    "example": "any"
                  },
                  "fname": {
                    "example": "any"
                  },
                  "lname": {
                    "example": "any"
                  },
                  "email": {
                    "example": "any"
                  },
                  "organization": {
                    "example": "any"
                  },
                  "password": {
                    "example": "any"
                  }
                }
              }
            }
          ],
          "responses": {
            "200": {
              "description": "OK"
            },
            "201": {
              "description": "Created"
            },
            "400": {
              "description": "Bad Request"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "Forbidden"
            }
          }
        }
      },
      "/{orgName}/collections/queries": {
        "post": {
          "description": "",
          "parameters": [
            {
              "name": "orgName",
              "in": "path",
              "required": true,
              "type": "string"
            },
            {
              "name": "limit",
              "in": "query",
              "type": "string"
            },
            {
              "name": "next",
              "in": "query",
              "type": "string"
            },
            {
              "name": "body",
              "in": "body",
              "schema": {
                "type": "object",
                "properties": {
                  "organization": {
                    "example": "any"
                  },
                  "organizationId": {
                    "example": "any"
                  },
                  "_id": {
                    "example": "any"
                  },
                  "fname": {
                    "example": "any"
                  },
                  "lname": {
                    "example": "any"
                  },
                  "email": {
                    "example": "any"
                  },
                  "password": {
                    "example": "any"
                  }
                }
              }
            }
          ],
          "responses": {
            "200": {
              "description": "OK"
            },
            "201": {
              "description": "Created"
            },
            "400": {
              "description": "Bad Request"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "Forbidden"
            }
          }
        }
      },
      "/{orgName}/collections/{collectionName}": {
        "delete": {
          "description": "",
          "parameters": [
            {
              "name": "orgName",
              "in": "path",
              "required": true,
              "type": "string"
            },
            {
              "name": "collectionName",
              "in": "path",
              "required": true,
              "type": "string"
            },
            {
              "name": "body",
              "in": "body",
              "schema": {
                "type": "object",
                "properties": {
                  "fname": {
                    "example": "any"
                  },
                  "lname": {
                    "example": "any"
                  },
                  "email": {
                    "example": "any"
                  },
                  "organization": {
                    "example": "any"
                  },
                  "password": {
                    "example": "any"
                  }
                }
              }
            }
          ],
          "responses": {
            "200": {
              "description": "OK"
            },
            "201": {
              "description": "Created"
            },
            "400": {
              "description": "Bad Request"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "Forbidden"
            }
          }
        }
      },
      "/{orgName}/collections/{collectionName}/entities": {
        "post": {
          "description": "",
          "parameters": [
            {
              "name": "orgName",
              "in": "path",
              "required": true,
              "type": "string"
            },
            {
              "name": "collectionName",
              "in": "path",
              "required": true,
              "type": "string"
            },
            {
              "name": "body",
              "in": "body",
              "schema": {
                "type": "object",
                "properties": {
                  "data": {
                    "example": "any"
                  },
                  "fname": {
                    "example": "any"
                  },
                  "lname": {
                    "example": "any"
                  },
                  "email": {
                    "example": "any"
                  },
                  "organization": {
                    "example": "any"
                  },
                  "password": {
                    "example": "any"
                  }
                }
              }
            }
          ],
          "responses": {
            "201": {
              "description": "Created"
            },
            "400": {
              "description": "Bad Request"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "Forbidden"
            }
          }
        }
      },
      "/{orgName}/collections/{collectionName}/entities/{entityId}": {
        "get": {
          "description": "",
          "parameters": [
            {
              "name": "orgName",
              "in": "path",
              "required": true,
              "type": "string"
            },
            {
              "name": "collectionName",
              "in": "path",
              "required": true,
              "type": "string"
            },
            {
              "name": "entityId",
              "in": "path",
              "required": true,
              "type": "string"
            }
          ],
          "responses": {
            "200": {
              "description": "OK"
            },
            "201": {
              "description": "Created"
            },
            "400": {
              "description": "Bad Request"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "Forbidden"
            }
          }
        }
      },
      "/{orgName}/collections/{collectionName}/entities/{entityId}/{dateTimeLastUpdated}": {
        "patch": {
          "description": "",
          "parameters": [
            {
              "name": "orgName",
              "in": "path",
              "required": true,
              "type": "string"
            },
            {
              "name": "collectionName",
              "in": "path",
              "required": true,
              "type": "string"
            },
            {
              "name": "entityId",
              "in": "path",
              "required": true,
              "type": "string"
            },
            {
              "name": "dateTimeLastUpdated",
              "in": "path",
              "required": true,
              "type": "string"
            },
            {
              "name": "body",
              "in": "body",
              "schema": {
                "type": "object",
                "properties": {
                  "keykey": {
                    "example": "any"
                  },
                  "fname": {
                    "example": "any"
                  },
                  "lname": {
                    "example": "any"
                  },
                  "email": {
                    "example": "any"
                  },
                  "organization": {
                    "example": "any"
                  },
                  "password": {
                    "example": "any"
                  }
                }
              }
            }
          ],
          "responses": {
            "200": {
              "description": "OK"
            },
            "201": {
              "description": "Created"
            },
            "400": {
              "description": "Bad Request"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "Forbidden"
            },
            "404": {
              "description": "Not Found"
            }
          }
        }
      },
      "/{orgName}/collections/{collectionName}/entities/queries": {
        "post": {
          "description": "",
          "parameters": [
            {
              "name": "orgName",
              "in": "path",
              "required": true,
              "type": "string"
            },
            {
              "name": "collectionName",
              "in": "path",
              "required": true,
              "type": "string"
            },
            {
              "name": "limit",
              "in": "query",
              "type": "string"
            },
            {
              "name": "next",
              "in": "query",
              "type": "string"
            },
            {
              "name": "body",
              "in": "body",
              "schema": {
                "type": "object",
                "properties": {
                  "organizationId": {
                    "example": "any"
                  },
                  "organization": {
                    "example": "any"
                  },
                  "collection": {
                    "example": "any"
                  },
                  "_id": {
                    "example": "any"
                  },
                  "fname": {
                    "example": "any"
                  },
                  "lname": {
                    "example": "any"
                  },
                  "email": {
                    "example": "any"
                  },
                  "password": {
                    "example": "any"
                  }
                }
              }
            }
          ],
          "responses": {
            "200": {
              "description": "OK"
            },
            "201": {
              "description": "Created"
            },
            "400": {
              "description": "Bad Request"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "Forbidden"
            }
          }
        }
      },
      "/{entityId}/{dateTimeLastUpdated}": {
        "patch": {
          "description": "",
          "parameters": [
            {
              "name": "entityId",
              "in": "path",
              "required": true,
              "type": "string"
            },
            {
              "name": "dateTimeLastUpdated",
              "in": "path",
              "required": true,
              "type": "string"
            },
            {
              "name": "body",
              "in": "body",
              "schema": {
                "type": "object",
                "properties": {
                  "keykey": {
                    "example": "any"
                  }
                }
              }
            }
          ],
          "responses": {
            "200": {
              "description": "OK"
            },
            "400": {
              "description": "Bad Request"
            },
            "401": {
              "description": "Unauthorized"
            },
            "404": {
              "description": "Not Found"
            }
          }
        }
      },
      "/queries": {
        "post": {
          "description": "",
          "parameters": [
            {
              "name": "limit",
              "in": "query",
              "type": "string"
            },
            {
              "name": "next",
              "in": "query",
              "type": "string"
            },
            {
              "name": "body",
              "in": "body",
              "schema": {
                "type": "object",
                "properties": {
                  "organizationId": {
                    "example": "any"
                  },
                  "organization": {
                    "example": "any"
                  },
                  "_id": {
                    "example": "any"
                  }
                }
              }
            }
          ],
          "responses": {
            "200": {
              "description": "OK"
            },
            "401": {
              "description": "Unauthorized"
            }
          }
        }
      }
    }
  }

  export default swagger;