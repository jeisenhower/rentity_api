import swaggerAutogen from 'swagger-autogen';

const outputFile = "./swagger_output.json";
const endpointsFiles = ["./routes/auth.js", "./routes/organizations.js", "./routes/collections.js", "./routes/entities.js"];

swaggerAutogen(outputFile, endpointsFiles);