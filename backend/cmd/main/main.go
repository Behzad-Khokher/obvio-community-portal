package main

// @title           Obvio Community Portal API
// @version         1.0
// @description     Traffic safety community portal backend.
// @host            localhost:8080
// @BasePath        /api/v1

import (
	"log"
	"os"

	_ "github.com/behzad/obvio/docs"
	"github.com/behzad/obvio/internal/infrastructure/database"
	"github.com/behzad/obvio/internal/infrastructure/persistence"
	"github.com/behzad/obvio/internal/usecase"

	delivery "github.com/behzad/obvio/internal/presentation/http"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file, using environment variables")
	}

	dsn := os.Getenv("DB_PATH")
	if dsn == "" {
		dsn = "obvio.db"
	}

	videoRoot := os.Getenv("VIDEO_ROOT")
	if videoRoot == "" {
		videoRoot = "videos"
	}

	db, err := database.NewSQLiteDB(dsn)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	portalRepo := persistence.NewPortalRepo(db)
	trialRepo := persistence.NewTrialRepo(db)
	eventRepo := persistence.NewEventRepo(db)
	annotationRepo := persistence.NewAnnotationRepo(db)

	portalUC := usecase.NewPortalUsecase(portalRepo)
	trialUC := usecase.NewTrialUsecase(trialRepo)
	eventUC := usecase.NewEventUsecase(eventRepo, videoRoot)
	annotationUC := usecase.NewAnnotationUsecase(annotationRepo)
	insightsUC := usecase.NewInsightsUsecase(eventRepo)

	portalH := delivery.NewPortalHandler(portalUC)
	trialH := delivery.NewTrialHandler(trialUC)
	eventH := delivery.NewEventHandler(eventUC)
	annotationH := delivery.NewAnnotationHandler(annotationUC)
	insightsH := delivery.NewInsightsHandler(insightsUC)

	router := delivery.NewRouter(portalH, trialH, eventH, annotationH, insightsH, videoRoot)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("server starting on :%s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
