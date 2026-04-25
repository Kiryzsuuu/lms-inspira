#!/usr/bin/env python3
"""
MongoDB Atlas IP Whitelist Automation Script
Adds Azure App Service outbound IPs to MongoDB Atlas Network Access
"""

import requests
import sys
import json
from base64 import b64encode

def main():
    # Configuration
    PUBLIC_API_KEY = input("Enter MongoDB Atlas Public API Key: ").strip()
    PRIVATE_API_KEY = input("Enter MongoDB Atlas Private API Key: ").strip()
    ORG_ID = input("Enter MongoDB Organization ID: ").strip()
    PROJECT_ID = input("Enter MongoDB Project ID: ").strip()
    
    # Azure App Service outbound IPs
    AZURE_IPS = [
        "20.205.241.35",
        "20.205.241.53",
        "20.205.241.58",
        "20.205.241.81",
        "20.205.241.114",
        "20.198.191.118",
        "20.44.210.190",
        "20.198.128.32",
        "20.198.184.108",
        "20.198.186.124",
        "20.198.189.158",
        "20.198.190.32",
        "20.212.64.16"
    ]
    
    # Create Basic Auth header
    auth_string = b64encode(f"{PUBLIC_API_KEY}:{PRIVATE_API_KEY}".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth_string}",
        "Content-Type": "application/json"
    }
    
    base_url = f"https://cloud.mongodb.com/api/atlas/v1.0/groups/{PROJECT_ID}/accessList"
    
    print(f"\n🔧 Adding {len(AZURE_IPS)} Azure IPs to MongoDB Atlas whitelist...")
    print(f"Project ID: {PROJECT_ID}\n")
    
    success_count = 0
    fail_count = 0
    
    for ip in AZURE_IPS:
        payload = {
            "ipAddress": ip,
            "comment": f"Azure App Service - LMS Inspira Backend"
        }
        
        try:
            response = requests.post(base_url, headers=headers, json=payload)
            
            if response.status_code in [200, 201]:
                print(f"✅ Added: {ip}")
                success_count += 1
            elif response.status_code == 409:
                print(f"⏭️  Already exists: {ip}")
                success_count += 1
            else:
                print(f"❌ Failed: {ip} (HTTP {response.status_code})")
                print(f"   Error: {response.text}")
                fail_count += 1
                
        except Exception as e:
            print(f"❌ Error adding {ip}: {str(e)}")
            fail_count += 1
    
    print(f"\n✨ Summary: {success_count} successful, {fail_count} failed")
    
    if fail_count == 0:
        print("\n✅ All Azure IPs have been whitelisted in MongoDB Atlas!")
        print("⏳ Backend will reconnect within 30 seconds...")
        print("   Test: https://lms-inspira-api.azurewebsites.net/api/health")
    else:
        print(f"\n⚠️  {fail_count} IPs failed. Please check your credentials and try again.")
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nAborted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1)
