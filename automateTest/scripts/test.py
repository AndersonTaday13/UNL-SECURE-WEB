import requests
import json
import pandas as pd
import matplotlib.pyplot as plt
import os

def load_and_process_urls():
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        input_file = os.path.join(script_dir, 'output', 'output_complet.json')
        results_file = os.path.join(script_dir, 'output', 'results.csv')

        with open(input_file) as f:
            urls = json.load(f)

        response = requests.post("http://localhost:8080/test/test-scan-multiple", json=urls)
        
        if response.status_code == 200:
            results = response.json()

            df = pd.DataFrame(results)
            df.to_csv(results_file, index=False)
            print(f"Resultados guardados en '{results_file}'")
            return df
        else:
            print(f"Error: El servidor respondió con el código {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"Error durante el procesamiento: {str(e)}")
        return None

def calculate_metrics(df):
    print("\nResumen de datos:")
    print(df['expected'].value_counts())
    print("\nDistribución de predicciones:")
    print(df['detected'].value_counts())

    TP = len(df[(df['expected'] == 'malicious') & (df['detected'] == 'malicious')])
    FP = len(df[(df['expected'] == 'benign') & (df['detected'] == 'malicious')])
    FN = len(df[(df['expected'] == 'malicious') & (df['detected'] == 'benign')])
    TN = len(df[(df['expected'] == 'benign') & (df['detected'] == 'benign')])
    
    print("\nMatriz de confusión:")
    print(f"Verdaderos Positivos (TP): {TP}")
    print(f"Falsos Positivos (FP): {FP}")
    print(f"Falsos Negativos (FN): {FN}")
    print(f"Verdaderos Negativos (TN): {TN}")
    
    try:
        if (TP + FP) == 0:
            print("\nAdvertencia: No hay predicciones positivas (TP + FP = 0)")
            precision = 0
        else:
            precision = TP / (TP + FP)
            
        if (TP + FN) == 0:
            print("\nAdvertencia: No hay casos reales positivos (TP + FN = 0)")
            recall = 0
        else:
            recall = TP / (TP + FN)
            
        if (FP + TN) == 0:
            print("\nAdvertencia: No hay casos reales negativos (FP + TN = 0)")
            fpr = 0
        else:
            fpr = FP / (FP + TN)
        
        print("\nMétricas calculadas:")
        print(f"Precision: {precision:.3f}")
        print(f"Recall: {recall:.3f}")
        print(f"FPR: {fpr:.3f}")
        
        return precision, recall, fpr
    except Exception as e:
        print(f"\nError durante el cálculo de métricas: {str(e)}")
        return None, None, None

def plot_metrics(precision, recall, fpr):
    if precision is None or recall is None or fpr is None:
        print("No se puede generar el gráfico debido a errores en las métricas")
        return
        
    metrics = ['Precision', 'Recall', 'FPR']
    values = [precision, recall, fpr]
    
    plt.figure(figsize=(10, 6))
    bars = plt.bar(metrics, values, color=['green', 'blue', 'red'])

    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2., height,
                f'{height:.3f}',
                ha='center', va='bottom')
    
    plt.title("Métricas de Rendimiento del Detector")
    plt.ylim(0, 1.1)
    
    # Guardar el gráfico
    script_dir = os.path.dirname(os.path.abspath(__file__))
    plot_path = os.path.join(script_dir, 'output', 'metrics_plot.png')
    plt.savefig(plot_path)
    print(f"Gráfico guardado en: {plot_path}")
    plt.close()

def main():
    df = load_and_process_urls()
    if df is not None:
        if df.empty:
            print("Error: El DataFrame está vacío")
            return
        required_columns = ['expected', 'detected']
        if not all(col in df.columns for col in required_columns):
            print(f"Error: Faltan columnas requeridas. Columnas necesarias: {required_columns}")
            print(f"Columnas presentes: {df.columns.tolist()}")
            return

        precision, recall, fpr = calculate_metrics(df)
        plot_metrics(precision, recall, fpr)

if __name__ == "__main__":
    main()