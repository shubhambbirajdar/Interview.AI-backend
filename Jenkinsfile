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

        stage('Stage Deployment Files') {
            steps {
                sh '''
                    rsync -a --delete \
                      --exclude='.git/' \
                      --exclude='.env' \
                      --exclude='.envnano' \
                      --exclude='node_modules/' \
                      ./ /srv/interview-ai-backend-deploy/
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh 'sudo /usr/local/bin/deploy-interview-ai-backend'
            }
        }
    }
}