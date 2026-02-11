# Usamos a imagem oficial do Oracle Linux para garantir compatibilidade total
FROM ghcr.io/oracle/oraclelinux8-nodejs:20

# Instala o Instant Client via repositório oficial (sem wget, sem links quebrados)
USER root
RUN dnf -y install oracle-instantclient-release-el8 && \
    dnf -y install oracle-instantclient-basiclite && \
    rm -rf /var/cache/dnf

# No Oracle Linux, as bibliotecas ficam neste padrão:
ENV LD_LIBRARY_PATH=/usr/lib/oracle/21/client64/lib

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Expõe a porta
EXPOSE 3010

CMD ["node", "server.js"]