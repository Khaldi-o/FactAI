2. Build the Docker image:

```bash
cd transcribe
docker build -t transcribe-app .
```

3. Run the Docker container, mounting the local `downloads` directory:

```bash
docker run -it --rm -v $(pwd)/downloads/:/usr/src/app/downloads transcribe-app
```
