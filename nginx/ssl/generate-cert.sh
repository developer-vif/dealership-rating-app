#!/bin/bash

# Generate self-signed SSL certificate for orcr-agad.com
# This is for development/testing purposes only

echo "Generating self-signed SSL certificate for orcr-agad.com..."

# Create private key
openssl genrsa -out orcr-agad.com.key 2048

# Create certificate signing request
openssl req -new -key orcr-agad.com.key -out orcr-agad.com.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=orcr-agad.com/subjectAltName=DNS:orcr-agad.com,DNS:www.orcr-agad.com"

# Create certificate with SAN (Subject Alternative Names)
cat > orcr-agad.com.conf <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = State
L = City
O = Organization
CN = orcr-agad.com

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = orcr-agad.com
DNS.2 = www.orcr-agad.com
EOF

# Generate self-signed certificate valid for 365 days
openssl req -new -x509 -key orcr-agad.com.key -out orcr-agad.com.crt -days 365 -config orcr-agad.com.conf -extensions v3_req

# Set appropriate permissions
chmod 600 orcr-agad.com.key
chmod 644 orcr-agad.com.crt

# Clean up
rm orcr-agad.com.csr orcr-agad.com.conf

echo "SSL certificate generated successfully!"
echo "Certificate: orcr-agad.com.crt"
echo "Private key: orcr-agad.com.key"
echo ""
echo "Note: This is a self-signed certificate for development only."
echo "For production, use Let's Encrypt or a commercial CA."