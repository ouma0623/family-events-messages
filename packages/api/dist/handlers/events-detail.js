"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const dynamodb_1 = require("../repositories/dynamodb");
async function handler(event) {
    try {
        const eventId = event.pathParameters?.id;
        if (!eventId) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({ error: 'eventId is required' }),
            };
        }
        const repository = new dynamodb_1.DynamoDBEventRepository();
        const eventData = await repository.getById(eventId);
        if (!eventData) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({ error: 'Event not found' }),
            };
        }
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(eventData),
        };
    }
    catch (error) {
        console.error('events-detail error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
}
//# sourceMappingURL=events-detail.js.map