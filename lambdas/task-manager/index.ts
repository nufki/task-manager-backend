
import {APIGatewayEvent, APIGatewayProxyHandler} from "aws-lambda";
import { createTask, getAllTasks, getTask, updateTask, deleteTask } from "./task.service";

const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
};

export const handler: APIGatewayProxyHandler = async (event:APIGatewayEvent) => {
    const { httpMethod, resource, pathParameters, body } = event;
    const cognitoUserId = event.requestContext.authorizer?.claims?.sub || "";

    try {
        let response;
        switch (httpMethod) {
            case "POST":
                console.log("Received body:", body);
                const td = JSON.parse(body || "{}");
                response = await createTask(td, cognitoUserId);
                break;
            case "GET":
                const queryParams = event.queryStringParameters || {};
                const limit = queryParams.limit ? parseInt(queryParams.limit, 10) : undefined;
                const nextToken = queryParams.nextToken || undefined;
                response = await getAllTasks(limit, nextToken);
                break;
            case "PUT":
                response = await updateTask(
                    pathParameters?.id || "",
                    JSON.parse(body || "{}")
                );
                break;
            case "DELETE":
                response = await deleteTask(pathParameters?.id || "");
                break;
            default:
                response = {
                    statusCode: 400,
                    body: JSON.stringify({ message: "Unsupported HTTP method" }),
                };
        }

        return { ...response, headers };
    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};