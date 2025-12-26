

import {QdrantClient} from '@qdrant/js-client-rest';

export const vec_client = new QdrantClient({
    url: 'https://b56605b6-c3cf-4b73-bef0-77b0e41aa747.us-east4-0.gcp.cloud.qdrant.io:6333',
    apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwiZXhwIjoxNzc0NTA2Njk5fQ.q1-WVV_lhHKD4e4svsf-5f8GDbZgwBHuUCglr3MdizQ',
});

export async function initCollection() {
    await vec_client.createCollection("kb_vector2", {
        vectors: {
            size: 768,
            distance: "Cosine"
        }
    });
}

try {
    const result = await vec_client.getCollections();
    console.log('List of collections:', result.collections);
} catch (err) {
    console.error('Could not get collections:', err);
}