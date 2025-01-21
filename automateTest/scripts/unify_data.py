import json
import random
import os

def merge_json_files(file1, file2, output_file, sample_size):
    try:
        with open(file1, 'r') as f1, open(file2, 'r') as f2:
            data1 = json.load(f1)
            data2 = json.load(f2)

            # Tomar el mismo número de muestras que se especificó al crear los archivos JSON
            sample1 = data1  # Ya no necesitamos sample porque los datos ya están muestreados
            sample2 = data2

            combined = sample1 + sample2
            random.shuffle(combined)

            # Asegurar que el directorio de salida existe
            os.makedirs(os.path.dirname(output_file), exist_ok=True)
            
            with open(output_file, 'w') as out:
                json.dump(combined, out, indent=2)
            print(f"Archivo combinado guardado en: {output_file}")
    except Exception as e:
        print(f"Error al unificar archivos: {str(e)}")

def main(sample_size):  # Cambiado el valor por defecto a 2000
    script_dir = os.path.dirname(os.path.abspath(__file__))
    benign_file = os.path.join(script_dir, 'output', 'output_benign.json')
    malicious_file = os.path.join(script_dir, 'output', 'output_malicious.json')
    output_file = os.path.join(script_dir, 'output', 'output_complet.json')

    merge_json_files(benign_file, malicious_file, output_file, sample_size)

if __name__ == "__main__":
    main()