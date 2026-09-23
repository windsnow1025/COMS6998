# Commands

## Apply

```bash
# App
kubectl apply -f ./app-configmap.yaml

# PostgreSQL
kubectl apply -f ./postgresql/postgresql-pvc.yaml
kubectl apply -f ./postgresql/postgresql-deployment.yaml
kubectl apply -f ./postgresql/postgresql-service.yaml

# Nest.js
kubectl apply -f ./nest/nest-service.yaml

# Next.js
kubectl apply -f ./next/next-service.yaml

# Nginx
kubectl apply -f ./nginx/nginx-configmap.yaml
kubectl apply -f ./nginx/nginx-deployment.yaml
kubectl apply -f ./nginx/nginx-service.yaml
```

### Production

```bash
# App
kubectl apply -f ./app-secret.yaml

# Nest
kubectl apply -f ./nest/nest-deployment.yaml

# Next
kubectl apply -f ./next/next-deployment.yaml
```

### Test

```bash
# App
kubectl apply -f ./app-secret-test.yaml

# Nest
kubectl apply -f ./nest/nest-deployment-test.yaml

# Next
kubectl apply -f ./next/next-deployment-test.yaml
```

## Restart

```bash
# Dashboard
kubectl rollout restart deployment -n kubernetes-dashboard

# PostgreSQL
kubectl rollout restart deployment postgresql-deployment

# Nest.js
kubectl rollout restart deployment nest-deployment

# Next.js
kubectl rollout restart deployment next-deployment

# Nginx
kubectl rollout restart deployment nginx-deployment
```
