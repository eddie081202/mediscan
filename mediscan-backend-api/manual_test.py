import sys
import os
from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from main import app

def run_manual_tests():
    my_app = TestClient(app)
    
    # Test 1: Root endpoint
    response_root = my_app.get("/")
    if response_root.status_code != 200:
        print("read_root method is not working")

    # Test 2: Invalid file type validation
    response_invalid = my_app.post(
        "/api/extract",
        files={"file": ("test.txt", b"dummy content", "text/plain")}
    )
    if response_invalid.status_code != 400:
        print("extract_prescription method is not working (validation failed)")

    # Test 3: Interactive test
    print("\n--- Interactive Method Execution ---")
    image_path = input("Enter path to a test image (or press Enter to skip): ").strip()
    
    if image_path:
        if not os.path.exists(image_path):
            pass
        else:
            with open(image_path, "rb") as f:
                file_bytes = f.read()
            
            response_valid = my_app.post(
                "/api/extract",
                files={"file": (os.path.basename(image_path), file_bytes, "image/jpeg")}
            )
            
            if response_valid.status_code != 200:
                print("extract_prescription method is not working")
            else:
                data = response_valid.json()
                if "medication_name" not in data or "usage_instructions" not in data:
                    print("extract_prescription method is not working (missing expected data)")

if __name__ == "__main__":
    run_manual_tests()
