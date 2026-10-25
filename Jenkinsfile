
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

        stage('Validate Application') {
            steps {
                sh 'test -f index.js'
                sh 'node --check index.js'
                echo 'Basic application checks passed.'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Validation passed. PM2 deployment will be configured next.'
            }
        }
    }
}
