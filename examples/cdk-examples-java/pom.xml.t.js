const path = require('path');
const version = require('./package.json').version;

const mavenFromNpm = name => ({
    version: require(`${name}/package.json`).version.replace(/\+.+$/, ''), // remove "+build" component from version when building in ci
    repo: path.join(path.dirname(require.resolve(name)), 'maven-repo'),
});

const cdk = mavenFromNpm('aws-cdk-java');
const jsii = mavenFromNpm('jsii-java-runtime');

process.stdout.write(`
<?xml version="1.0" encoding="UTF-8"?>

<!-- Generated by ${__filename} at ${new Date().toISOString()} -->
<project xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd" xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <modelVersion>4.0.0</modelVersion>

    <repositories>
        <repository>
            <id>cdk</id>
            <url>file://${cdk.repo}</url>
        </repository>
        <repository>
            <id>jsii</id>
            <url>file://${jsii.repo}</url>
        </repository>
    </repositories>

    <groupId>com.amazonaws.cdk</groupId>
    <artifactId>cdk-examples-java</artifactId>
    <version>${version}</version>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.7.0</version>
                <configuration>
                    <source>1.8</source>
                    <target>1.8</target>
                </configuration>
            </plugin>

            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-assembly-plugin</artifactId>
                <version>3.1.0</version>
                <configuration>
                    <descriptorRefs>
                        <descriptorRef>jar-with-dependencies</descriptorRef>
                    </descriptorRefs>
                    <archive>
                        <manifest>
                            <mainClass>com.amazonaws.cdk.examples.HelloJavaApp</mainClass>
                        </manifest>
                    </archive>
                </configuration>
                <executions>
                    <execution>
                        <id>make-assembly</id> <!-- this is used for inheritance merges -->
                        <phase>package</phase> <!-- bind to the packaging phase -->
                            <goals>
                            <goal>single</goal>
                        </goals>
                    </execution>
              </executions>
            </plugin>

        </plugins>
    </build>

    <dependencies>
        <dependency>
            <groupId>software.amazon.jsii</groupId>
            <artifactId>jsii-runtime</artifactId>
            <version>${jsii.version}</version>
        </dependency>

        <dependency>
            <groupId>software.amazon.awscdk</groupId>
            <artifactId>cdk</artifactId>
            <version>${cdk.version}</version>
        </dependency>

        <dependency>
            <groupId>software.amazon.awscdk</groupId>
            <artifactId>ec2</artifactId>
            <version>${cdk.version}</version>
        </dependency>
        <dependency>
            <groupId>software.amazon.awscdk</groupId>
            <artifactId>s3</artifactId>
            <version>${cdk.version}</version>
        </dependency>
        <dependency>
            <groupId>software.amazon.awscdk</groupId>
            <artifactId>sns</artifactId>
            <version>${cdk.version}</version>
        </dependency>
        <dependency>
            <groupId>software.amazon.awscdk</groupId>
            <artifactId>sqs</artifactId>
            <version>${cdk.version}</version>
        </dependency>

        <!-- https://mvnrepository.com/artifact/com.fasterxml.jackson.core/jackson-core -->
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-core</artifactId>
            <version>2.9.5</version>
        </dependency>

        <!-- https://mvnrepository.com/artifact/com.fasterxml.jackson.core/jackson-databind -->
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>2.9.5</version>
        </dependency>

        <!-- https://mvnrepository.com/artifact/junit/junit -->
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>4.12</version>
            <scope>test</scope>
        </dependency>

    </dependencies>


</project>
`);
