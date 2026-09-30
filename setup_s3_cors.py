import os
import boto3
from dotenv import load_dotenv

load_dotenv()

def apply_cors_rule():
    bucket_name = os.getenv("AWS_S3_BUCKET_NAME")
    region = os.getenv("AWS_REGION")
    access_key = os.getenv("AWS_ACCESS_KEY_ID")
    secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")

    if not bucket_name or not access_key or not secret_key:
        print("❌ Error: Missing S3 credentials or bucket name in .env file.")
        return

    print(f"Connecting to AWS S3 bucket: {bucket_name}...")
    
    s3_client = boto3.client(
        "s3",
        region_name=region,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key
    )

    cors_configuration = {
        'CORSRules': [
            {
                'AllowedHeaders': ['*'],
                'AllowedMethods': ['PUT', 'POST', 'GET', 'HEAD'],
                'AllowedOrigins': ['*'],
                'ExposeHeaders': ['ETag']
            }
        ]
    }

    try:
        s3_client.put_bucket_cors(
            Bucket=bucket_name,
            CORSConfiguration=cors_configuration
        )
        print(f"✅ Success! AWS S3 CORS Policy applied to '{bucket_name}'.")
        print("Browsers can now upload files directly to your bucket without network errors!")
    except Exception as e:
        print(f"❌ Failed to apply CORS Policy: {e}")

if __name__ == "__main__":
    apply_cors_rule()
