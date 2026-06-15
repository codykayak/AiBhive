FROM ubuntu:24.04

# Prevent interactive prompts during apt install
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies needed for React Native, Node, and Android SDK
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    unzip \
    git \
    openjdk-17-jdk \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Set up Android SDK paths
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Download and install Android Command Line Tools
RUN mkdir -p $ANDROID_HOME/cmdline-tools && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdline-tools.zip && \
    unzip -q cmdline-tools.zip -d $ANDROID_HOME/cmdline-tools && \
    rm cmdline-tools.zip && \
    mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest

# Accept Android SDK licenses
RUN yes | sdkmanager --licenses

# Install required Android components (matching typical Expo SDK requirements)
RUN sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

# Copy the Expo project
WORKDIR /app
COPY . .

# Install NPM dependencies
RUN npm install

# Command to build the APK
CMD ["npx", "expo", "prebuild", "-p", "android", "&&", "cd", "android", "&&", "./gradlew", "assembleRelease"]
