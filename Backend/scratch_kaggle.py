import kagglehub
import pandas as pd
import os

path = kagglehub.dataset_download("dongrelaxman/amazon-reviews-dataset")
print("Dataset downloaded to:", path)

for root, dirs, files in os.walk(path):
    for f in files:
        if f.endswith('.csv'):
            csv_path = os.path.join(root, f)
            print("Found CSV:", csv_path)
            try:
                df = pd.read_csv(csv_path, nrows=5)
                print("Columns:", df.columns.tolist())
                print(df.head())
            except Exception as e:
                print("Error reading:", e)
