import sys
import os
from fastapi.testclient import TestClient

# Make sure we can import from the MediScan project root
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from main import app

def run_manual_tests():
    # Instantiate the class/application we are testing
    # This is equivalent to 'Calculator myCalculator = new Calculator();'
    my_app = TestClient(app)
    
    # -----------------------------------------------------
    # Test 1: Testing the read_root method
    # -----------------------------------------------------
    response_root = my_app.get("/")
    # Principle: "report only the methods that are not working"
    if response_root.status_code != 200:
        print("read_root method is not working")

    # -----------------------------------------------------
    # Test 2: Testing extract_prescription method handling
    #         for invalid file types
    # -----------------------------------------------------
    response_invalid = my_app.post(
        "/api/extract",
        files={"file": ("test.txt", b"dummy content", "text/plain")}
    )
    if response_invalid.status_code != 400:
        print("extract_prescription method is not working (validation failed)")

    # -----------------------------------------------------
    # Test 3: Testing extract_prescription interactively
    # Principles used:
    # 1. Use user input dynamically (like Scanner in the example)
    # 2. Extract and assert the result.
    # -----------------------------------------------------
    print("\n--- Interactive Method Execution ---")
    
    # Equivalent to: System.out.println("Enter num1"); int num1 = scan.nextInt();
    image_path = input("Enter path to a test image (or press Enter to skip): ").strip()
    
    if image_path:
        if not os.path.exists(image_path):
            # Since the file not existing is a setup error and not a method error,
            # we technically shouldn't print that the method failed here.
            pass
        else:
            with open(image_path, "rb") as f:
                file_bytes = f.read()
            
            # Execute the method we are testing
            response_valid = my_app.post(
                "/api/extract",
                files={"file": (os.path.basename(image_path), file_bytes, "image/jpeg")}
            )
            
            # Validate output vs expected expectations.
            if response_valid.status_code != 200:
                print("extract_prescription method is not working")
            else:
                data = response_valid.json()
                if "medication_name" not in data or "usage_instructions" not in data:
                    print("extract_prescription method is not working (missing expected data)")

if __name__ == "__main__":
    run_manual_tests()
