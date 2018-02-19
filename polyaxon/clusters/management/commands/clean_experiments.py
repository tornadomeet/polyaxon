from django.core.management import BaseCommand

from experiments.models import Experiment
from spawner import scheduler
from spawner.utils.constants import ExperimentLifeCycle


class Command(BaseCommand):
    def handle(self, *args, **options):
        for experiment in Experiment.objects.filter(
                experiment_status__status__in=ExperimentLifeCycle.DONE_STATUS):
            scheduler.stop_experiment(experiment)