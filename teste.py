import pandas as pd

# Lê a planilha do Excel
df = pd.read_excel('telefones_novos (4).xlsx')

# Pega a segunda coluna (índice 1)

linhas = []
# Itera sobre os valores da segunda coluna
for index, row in df.iterrows():
    if "/" in str(row[1]):
        partes = str(row[1]).replace(" ", "").split("/")
        for v in partes:
            if len(v) ==11:
                linhas.append([row[0],"55"+v])
    else:
        v= str(row[1]).replace(" ", "")
        if len(v) ==11:
            linhas.append([row[0],"55"+v])
df_partes = pd.DataFrame(linhas, columns=['REGIAO', 'NUMERO'])
# Salva o DataFrame em um novo arquivo Excel
df_partes.to_excel('listaformatada.xlsx', index=False)