import os
import boto3
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

def apply_lifecycle_rule():
    bucket_name = os.getenv("AWS_S3_BUCKET_NAME")
    region = os.getenv("AWS_REGION")
    access_key = os.getenv("AWS_ACCESS_KEY_ID")
    secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")

    if not bucket_name or not access_key or not secret_key:
        print("❌ Error: Missing S3 credentials or bucket name in .env file.")
        print("Please ensure AWS_S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY are set.")
        return

    print(f"Connecting to AWS S3 bucket: {bucket_name}...")
    
    s3_client = boto3.client(
        "s3",
        region_name=region,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key
    )

    lifecycle_configuration = {
        'Rules': [
            {
                'ID': 'WeeklyAutoDeleteRule',
                'Prefix': '',  # Apply to all objects in the bucket
                'Status': 'Enabled',
                'Expiration': {
                    'Days': 7  # Automatically delete after 7 days
                },
                'AbortIncompleteMultipartUpload': {
                    'DaysAfterInitiation': 1 # Clean up failed uploads to save space
                }
            }
        ]
    }

    try:
        s3_client.put_bucket_lifecycle_configuration(
            Bucket=bucket_name,
            LifecycleConfiguration=lifecycle_configuration
        )
        print(f"✅ Success! AWS S3 Lifecycle Rule applied to '{bucket_name}'.")
        print("All stored data will now automatically be deleted exactly 7 days after it is uploaded.")
        print("Incomplete/failed uploads will also be deleted after 1 day.")
    except Exception as e:
        print(f"❌ Failed to apply Lifecycle Rule: {e}")
        print("You may need to add the 's3:PutLifecycleConfiguration' permission to your AWS IAM user.")

if __name__ == "__main__":
    apply_lifecycle_rule()
