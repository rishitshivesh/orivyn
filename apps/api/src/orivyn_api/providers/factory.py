"""Construct model provider only when requested."""

from orivyn_api.providers.base import ProposalProvider
from orivyn_api.providers.cactus import CactusProvider


def create_provider(name: str) -> ProposalProvider:
    if name == "cactus":
        return CactusProvider()
    raise ValueError("Inference provider not enabled")
