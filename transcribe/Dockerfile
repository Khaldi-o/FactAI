# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Install system dependencies for yt-dlp, ffmpeg, and libssl-dev
RUN apt-get update && \
    apt-get install -y ffmpeg libssl-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy the requirements.txt first to leverage Docker cache
COPY requirements.txt ./

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Download necessary NLTK resources
RUN python -m nltk.downloader punkt
RUN python -m nltk.downloader punkt_tab

# Now copy the rest of your app's source code
COPY . .

# Define environment variable
ENV NAME World

# Run transcribe.py when the container launches
CMD ["python", "./transcribe.py"]
