// handler.ts

import { APIGatewayProxyHandler } from "aws-lambda";
import { createTask, getAllTasks, getTask, updateTask, deleteTask } from "./task.service";

const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
};

export const handler: APIGatewayProxyHandler = async (event) => {
    const { httpMethod, resource, pathParameters, body } = event;

    try {
        let response;
        switch (httpMethod) {
            case "POST":
                response = await createTask(JSON.parse(body || "{}"));
                break;
            case "GET":
                response =
                    resource === "/tasks/{id}"
                        ? await getTask(pathParameters?.id || "")
                        : await getAllTasks();
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