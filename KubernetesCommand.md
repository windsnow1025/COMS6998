# Commands

## Apply

```bash
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

# Next
kubectl apply -f ./next/next-deployment.yaml
```

### Test

```bash
# App
kubectl apply -f ./app-secret-test.yaml

# Next
kubectl apply -f ./next/next-deployment-test.yaml
```

## Restart

```bash
# Dashboard
kubectl rollout restart deployment -n kubernetes-dashboard

# Next.js
kubectl rollout restart deployment next-deployment

# Nginx
kubectl rollout restart deployment nginx-deployment
```
