import csv
import json
import random
import os

def csv_to_json(input_csv, output_json, sample_size):
    try:
        # Asegurar que el directorio de salida existe
        os.makedirs(os.path.dirname(output_json), exist_ok=True)
        
        with open(input_csv, 'r', encoding='utf-8') as csv_file:
            csv_reader = list(csv.reader(csv_file))

            if len(csv_reader) < sample_size:
                print(f"El tamaño del muestreo ({sample_size}) excede el número total de filas ({len(csv_reader)}).")
                return

            random_sample = random.sample(csv_reader, sample_size)

            result = []
            for row in random_sample:
                url = row[2] if len(row) > 2 else None
                if url:
                    result.append({
                        "url": url,
                        "expected": "malicious"
                    })

        with open(output_json, 'w', encoding='utf-8') as json_file:
            json.dump(result, json_file, indent=2)

        print(f"Archivo JSON creado exitosamente: {output_json}")
    except Exception as e:
        print(f"Ocurrió un error: {e}")

def main(sample_size=None):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_csv = os.path.join(script_dir, 'input', 'input_malicious.csv')
    output_json = os.path.join(script_dir, 'output', 'output_malicious.json')

    if sample_size is None:
        try:
            sample_size = int(input("Ingrese el tamaño de la muestra para malicious: "))
        except ValueError:
            print("Por favor, ingrese un número válido.")
            return

    csv_to_json(input_csv, output_json, sample_size)

if __name__ == "__main__":
    main()
