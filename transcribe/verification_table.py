import csv

class VerificationTable:
    def __init__(self, table_data):
        self.table_data = table_data

    def display(self):
        print("\nTableau de vérification :")
        print("Information | Vérification | Description")
        print("----------- | ------------ | -----------")

        for row in self.table_data:
            information = row['Information']
            verification = row['Vérification']
            description = row['Description']

            print(f"{information[:50]:<50} | {verification:<12} | {description[:50]}")
            if len(information) > 50 or len(description) > 50:
                print(f"{information[50:]:<50} | {'':<12} | {description[50:]}")

        print("\n")
        
    def export_to_csv(self, filename):
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['Information', 'Vérification', 'Description']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

            writer.writeheader()
            for row in self.table_data:
                writer.writerow(row)

        print(f"Le tableau de vérification a été exporté vers {filename}")