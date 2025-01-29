import dotenv from 'dotenv';

dotenv.config({
    path: '.env.local'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        WEAVIATE_HOST: process.env.WEAVIATE_HOST || 'localhost',
        WEAVIATE_PORT: process.env.WEAVIATE_PORT
    }
};

export default nextConfig;
