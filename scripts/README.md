# Database Access Scripts

Scripts para i-access ang PostgreSQL databases ng bawat environment via pgAdmin4.

## Port Allocation

| Environment | Landregistry | Documents | Users  | Payments |
|-------------|--------------|-----------|--------|----------|
| **Local/Dev** | 15432      | 15433     | 15434  | 15435    |
| **QA**        | 25432      | 25433     | 25434  | 25435    |
| **UAT**       | 35432      | 35433     | 35434  | 35435    |
| **PROD**      | 45432      | 45433     | 45434  | 45435    |

## Database Credentials

- **Username**: `postgres`
- **Password**: `password`

## Usage

### Local/Dev Environment
```bash
./scripts/local-db-access.sh
```

### QA Environment
```bash
./scripts/qa-db-access.sh
```

### UAT Environment
```bash
./scripts/uat-db-access.sh
```

### PROD Environment
```bash
./scripts/prod-db-access.sh
```

## pgAdmin4 Connection

1. Run the appropriate script for your environment
2. In pgAdmin4, create new server with:
   - **Host**: `localhost`
   - **Port**: (see table above)
   - **Maintenance database**: `postgres`
   - **Username**: `postgres`
   - **Password**: `password`

3. After connecting, expand the server to see environment-specific databases:
   - QA: `terraflow_*_qa`
   - UAT: `terraflow_*_uat`
   - PROD: `terraflow_*_prod`

## Stop Port Forwarding

Press `Ctrl+C` in the terminal where the script is running.
