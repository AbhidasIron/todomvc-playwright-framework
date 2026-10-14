// Requires plugins: Docker Pipeline, JUnit, HTML Publisher, Allure Jenkins Plugin.
pipeline {
    agent {
        docker {
            image 'mcr.microsoft.com/playwright:v1.64.0-noble'
            args '--ipc=host'
        }
    }

    parameters {
        choice(name: 'TEST_ENV', choices: ['qa', 'staging', 'prod'], description: 'Target environment')
        choice(
            name: 'SUITE',
            choices: ['all-browsers', 'smoke', 'chromium', 'firefox', 'webkit', 'mobile', 'a11y', 'bdd', 'visual'],
            description: 'Which suite to run'
        )
    }

    triggers {
        cron('H 2 * * *') // nightly regression
    }

    options {
        timeout(time: 45, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
        timestamps()
    }

    environment {
        CI = 'true'
        TEST_ENV = "${params.TEST_ENV}"
        HOME = "${WORKSPACE}" // npm cache must be writable inside the container
    }

    stages {
        stage('Install') {
            steps {
                sh 'npm ci --ignore-scripts'
                sh 'npx bddgen'
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint'
                sh 'npm run format:check'
            }
        }

        stage('Test') {
            steps {
                script {
                    def suites = [
                        'all-browsers': 'npm test',
                        'smoke'       : 'npm run test:smoke',
                        'chromium'    : 'npx playwright test --project=chromium',
                        'firefox'     : 'npx playwright test --project=firefox',
                        'webkit'      : 'npx playwright test --project=webkit',
                        'mobile'      : 'npm run test:mobile',
                        'a11y'        : 'npm run test:a11y',
                        'bdd'         : 'npx playwright test --project=bdd',
                        'visual'      : 'npm run test:visual',
                    ]
                    sh suites[params.SUITE]
                }
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: 'reports/junit/results.xml'

            publishHTML(target: [
                reportName : 'Playwright HTML Report',
                reportDir  : 'reports/html-report',
                reportFiles: 'index.html',
                keepAll    : true,
                alwaysLinkToLastBuild: true,
                allowMissing: true,
            ])
            publishHTML(target: [
                reportName : 'Execution Summary',
                reportDir  : 'reports/summary',
                reportFiles: 'summary.html',
                keepAll    : true,
                alwaysLinkToLastBuild: true,
                allowMissing: true,
            ])

            allure includeProperties: false, results: [[path: 'allure-results']]

            archiveArtifacts artifacts: 'test-results/**, reports/**', allowEmptyArchive: true
        }
        failure {
            echo 'Tests failed - see Execution Summary / Allure for reasons and screenshots.'
        }
    }
}
