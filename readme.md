To deploy this application to Minikube, follow these steps:
1. Start Minikube:
```bash
minikube start
```
2. Enable ingress addon:
```bash
minikube addons enable ingress
```
3. Build the Docker images:
```bash
eval $(minikube docker-env)
docker build -t file-client:1.0 ./client
docker build -t file-server:1.0 ./server
```
4. Apply the Kubernetes configurations:
```bash
kubectl apply -f k8s
```
5. Get the Minikube IP:
```bash
minikube ip
```
6. Add the IP to your /etc/hosts file:
```bash
echo "$(minikube ip) file-manager.local" | sudo tee -a /etc/hosts
```
Now you should be able to access the application at http://file-manager. local  Note: Make sure to update the server code to use an environment variable for the directory path instead of hardcoding it

- const directoryPath = '/Users/oshalmay/images';
+ const directoryPath = process.env.IMAGES_PATH || '/data/images';
  This setup will create a persistent volume for the images directory and make the application accessible through the ingress controller.