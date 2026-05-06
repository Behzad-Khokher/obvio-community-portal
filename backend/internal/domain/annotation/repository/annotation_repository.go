package repository

import "github.com/behzad/obvio/internal/domain/annotation"

type AnnotationRepository interface {
	FindByEventID(eventID uint) ([]annotation.Annotation, error)
	FindByID(id uint) (*annotation.Annotation, error)
	Create(a *annotation.Annotation) error
	Update(a *annotation.Annotation) error
	Delete(id uint) error
}
