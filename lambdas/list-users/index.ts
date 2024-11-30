import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityProviderClient, ListUsersCommand } from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({});
const userPoolId = process.env.USER_POOL_ID!;

const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
};

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    try {
        const queryParams = event.queryStringParameters || {};
        const searchUsername = queryParams.username;
        const nextToken = queryParams.nextToken;
        const limit = queryParams.limit ? parseInt(queryParams.limit, 10) : 10;

        const command = new ListUsersCommand({
            UserPoolId: userPoolId,
            Limit: limit,
            ...(nextToken && { PaginationToken: nextToken }),
            ...(searchUsername && { Filter: `username ^= "${searchUsername}"` }),
        });

        const response = await cognitoClient.send(command);

        // Extract only usernames from the response
        const usernames = response.Users?.map(user => user.Username) || [];

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                users: usernames,
                nextToken: response.PaginationToken,
            }),
        };
    } catch (error) {
        console.error('Error listing users:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to list users' }),
        };
    }
};