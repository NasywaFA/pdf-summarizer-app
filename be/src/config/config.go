package config

import (
	"app/src/utils"
	"os"

	"github.com/spf13/viper"
)

var (
	IsProd       bool
	AppHost      string
	AppPort      int
	DBHost       string
	DBUser       string
	DBPassword   string
	DBName       string
	DBPort       int
	RedirectURL  string
	UploadDir    = getEnv("UPLOAD_DIR", "./uploads")
	MLServiceURL = getEnv("ML_SERVICE_URL", "http://localhost:8000")
)

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func init() {
	loadConfig()

	// server configuration
	IsProd = viper.GetString("APP_ENV") == "prod"
	AppHost = viper.GetString("APP_HOST")
	AppPort = viper.GetInt("APP_PORT")

	// database configuration
	DBHost = viper.GetString("DB_HOST")
	DBUser = viper.GetString("DB_USER")
	DBPassword = viper.GetString("DB_PASSWORD")
	DBName = viper.GetString("DB_NAME")
	DBPort = viper.GetInt("DB_PORT")
}

func loadConfig() {
	configPaths := []string{
		"./",     // For app
		"../../", // For test folder
	}

	for _, path := range configPaths {
		viper.SetConfigFile(path + ".env")

		if err := viper.ReadInConfig(); err == nil {
			utils.Log.Infof("Config file loaded from %s", path)
			return
		}
	}

	utils.Log.Error("Failed to load any config file")
}
