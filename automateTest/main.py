from scripts import csv_to_json_benign, csv_to_json_malicious, unify_data, test

def main():
    print("Automated Test Started")
    
    # Definir un tamaño de muestra fijo para evitar input manual
    sample_size = 2000
    
    # Ejecutar la conversión de CSV a JSON
    csv_to_json_benign.main(sample_size)
    csv_to_json_malicious.main(sample_size)
    
    # Unificar datos y ejecutar pruebas
    unify_data.main(sample_size)
    test.main()

if __name__ == "__main__":
    main()