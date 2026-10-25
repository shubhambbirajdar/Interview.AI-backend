
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Check Node.js') {
            steps {
                sh 'node --version'
                sh 'npm --version'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build --if-present'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Build successful. Deployment will be configured next.'
            }
        }
    }
}
