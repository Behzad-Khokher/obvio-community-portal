package usecase

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"

	"github.com/behzad/obvio/internal/domain/event"
	eventRepo "github.com/behzad/obvio/internal/domain/event/repository"
)

type EventUsecase struct {
	repo      eventRepo.EventRepository
	videoRoot string
}

func NewEventUsecase(r eventRepo.EventRepository, videoRoot string) *EventUsecase {
	return &EventUsecase{repo: r, videoRoot: videoRoot}
}

func (u *EventUsecase) ListEvents(trialID uint) ([]event.Event, error) {
	return u.repo.FindByTrialID(trialID)
}

func (u *EventUsecase) GetEvent(id uint) (*event.Event, error) {
	return u.repo.FindByID(id)
}

func (u *EventUsecase) CreateEvent(e *event.Event) error {
	return u.repo.Create(e)
}

func (u *EventUsecase) UpdateEvent(id uint, input *event.Event) (*event.Event, error) {
	e, err := u.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	e.IsViolation = input.IsViolation
	e.ViolationType = input.ViolationType
	e.Duration = input.Duration
	e.Timestamp = input.Timestamp
	return e, u.repo.Update(e)
}

func (u *EventUsecase) DeleteEvent(id uint) error {
	return u.repo.Delete(id)
}

func (u *EventUsecase) UploadVideo(eventID uint, file multipart.File, filename string) (string, error) {
	ext := filepath.Ext(filename)
	dst := filepath.Join(u.videoRoot, "raw", fmt.Sprintf("event_%d%s", eventID, ext))
	if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
		return "", err
	}
	out, err := os.Create(dst)
	if err != nil {
		return "", err
	}
	defer out.Close()
	if _, err := io.Copy(out, file); err != nil {
		return "", err
	}
	videoURL := fmt.Sprintf("/videos/raw/event_%d%s", eventID, ext)
	e, err := u.repo.FindByID(eventID)
	if err != nil {
		return "", err
	}
	e.VideoURL = videoURL
	return videoURL, u.repo.Update(e)
}
